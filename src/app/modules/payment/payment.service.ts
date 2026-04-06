import { BookingStatus, PaymentStatus, SlotStatus } from "../../../generated/prisma/enums";
import { env } from "../../config/env";
import { createSSLCommerzSession, validateSSLCommerzTransaction } from "../../config/sslcommerz";
import { prisma } from "../../lib/prisma";
import { SSLCommerzSessionParams } from "../../types/sslcommerz.types";
import { SSLCOMMERZ_PRODUCT, VALID_PAYMENT_STATUSES } from "./payment.constants";

const initSSLCommerzSession = async (
    payment: PaymentRecord,
    booking: BookingRecord,
    user: UserRecord,
    slot: SlotRecord
) => {
    const serverUrl = env.SERVER_URL;

    const params: SSLCommerzSessionParams = {
        total_amount: payment.amount,
        currency: payment.currency,
        tran_id: payment.transactionId,

        // Callback URLs
        success_url: `${serverUrl}/api/v1/payments/success`,
        fail_url: `${serverUrl}/api/v1/payments/fail`,
        cancel_url: `${serverUrl}/api/v1/payments/cancel`,
        ipn_url: `${serverUrl}/api/v1/payments/ipn`,

        // Customer info
        cus_name: user.name,
        cus_email: user.email,
        cus_phone: user.phone || "N/A",
        cus_add1: "N/A",
        cus_city: "Dhaka",
        cus_country: "Bangladesh",

        // Product info
        ...SSLCOMMERZ_PRODUCT,

        // Custom values for tracking
        value_a: booking.id,    // bookingId
        value_b: payment.id,    // paymentId
        value_c: user.id,       // userId
        value_d: `${slot.field.name} - ${slot.startTime} to ${slot.endTime}`,
    };

    const sslResponse = await createSSLCommerzSession(params);
    // console.log('sslResponse:==>', sslResponse);
    return {
        sessionKey: sslResponse.sessionkey,
        gatewayPageURL: sslResponse.GatewayPageURL,
    };
};

const handleIPN = async (ipnData: {
    tran_id: string;
    val_id: string;
    status: string;
    amount?: string;
    card_type?: string;
    bank_tran_id?: string;
}) => {
    const { tran_id, val_id } = ipnData;

    // 1. Find payment by transactionId
    const payment = await prisma.payment.findUnique({
        where: { transactionId: tran_id },
        include: { booking: true },
    });

    if (!payment) {
        console.error(`[IPN] Payment not found for tran_id: ${tran_id}`);
        return { message: "Payment not found" };
    }

    // 2. Idempotency check — already processed
    if (payment.status === PaymentStatus.COMPLETED) {
        console.log(`[IPN] Payment ${tran_id} already completed. Skipping.`);
        return { message: "Already processed" };
    }

    // 3. If booking already cancelled (by cron or user), reject
    if (payment.booking.bookingStatus === BookingStatus.CANCELLED) {
        console.log(`[IPN] Booking ${payment.bookingId} already cancelled. Skipping.`);
        return { message: "Booking already cancelled" };
    }

    // 4. Validate with SSLCommerz — NEVER trust IPN data alone
    const validation = await validateSSLCommerzTransaction(val_id);

    const isValid = VALID_PAYMENT_STATUSES.includes(
        validation.status as (typeof VALID_PAYMENT_STATUSES)[number]
    );

    if (isValid) {
        // 5. Successful payment → Update in Serializable transaction
        await prisma.$transaction(
            async (tx) => {
                // Re-fetch payment to prevent race condition
                const freshPayment = await tx.payment.findUnique({
                    where: { id: payment.id },
                    include: { booking: true },
                });

                if (!freshPayment || freshPayment.status === PaymentStatus.COMPLETED) {
                    return; // Already processed
                }

                if (freshPayment.booking.bookingStatus === BookingStatus.CANCELLED) {
                    return; // Booking cancelled
                }

                const now = new Date();

                // Update payment
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: PaymentStatus.COMPLETED,
                        valId: validation.val_id,
                        bankTranId: validation.bank_tran_id,
                        cardType: validation.card_type,
                        paymentMethod: validation.card_type,
                        riskLevel: parseInt(validation.risk_level) || 0,
                        paidAt: now,
                    },
                });

                // Recalculate booking totals
                const allPayments = await tx.payment.findMany({
                    where: {
                        bookingId: payment.bookingId,
                        status: PaymentStatus.COMPLETED,
                    },
                });

                const totalPaid = allPayments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                ) + freshPayment.amount;

                const newDueAmount = Math.max(
                    0,
                    Math.round((freshPayment.booking.totalAmount - totalPaid) * 100) / 100
                );

                const isFullyPaid = newDueAmount <= 0;

                // Update booking
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        paidAmount: Math.round(totalPaid * 100) / 100,
                        dueAmount: newDueAmount,
                        bookingStatus: isFullyPaid
                            ? BookingStatus.CONFIRMED
                            : BookingStatus.PENDING,
                    },
                });

                console.log(
                    `[IPN] Payment ${tran_id} completed. Booking ${payment.bookingId} → ${isFullyPaid ? "CONFIRMED" : "PENDING (partial)"}`
                );
            },
            { isolationLevel: "Serializable" }
        );
    } else {
        // 6. Failed / Invalid payment
        await prisma.$transaction(
            async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: PaymentStatus.FAILED,
                        valId: validation.val_id || null,
                    },
                });

                // Cancel booking and free slot
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: {
                        bookingStatus: BookingStatus.CANCELLED,
                        cancelledAt: new Date(),
                        cancellationReason: `Payment failed - SSLCommerz status: ${validation.status}`,
                    },
                });

                await tx.slot.update({
                    where: { id: payment.booking.slotId },
                    data: { status: SlotStatus.AVAILABLE },
                });

                console.log(
                    `[IPN] Payment ${tran_id} failed. Booking ${payment.bookingId} cancelled, slot freed.`
                );
            },
            { isolationLevel: "Serializable" }
        );
    }

    return { message: "IPN processed" };
};

const handleSuccess = async (tranId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { transactionId: tranId },
    });

    if (!payment) {
        return {
            redirectUrl: `${env.CLIENT_URL}/booking/error?message=Payment not found`,
        };
    }

    return {
        redirectUrl: `${env.CLIENT_URL}/booking/success?bookingId=${payment.bookingId}`,
    };
};

const handleFail = async (tranId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { transactionId: tranId },
        include: { booking: true },
    });

    if (payment && payment.status === PaymentStatus.PENDING) {
        // Mark as failed if IPN hasn't processed yet
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.FAILED },
            });

            await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                    bookingStatus: BookingStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancellationReason: "Payment failed",
                },
            });

            await tx.slot.update({
                where: { id: payment.booking.slotId },
                data: { status: SlotStatus.AVAILABLE },
            });
        });
    }

    return {
        redirectUrl: `${env.CLIENT_URL}/booking/fail?bookingId=${payment?.bookingId || "unknown"}`,
    };
};

const handleCancel = async (tranId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { transactionId: tranId },
        include: { booking: true },
    });

    if (payment && payment.status === PaymentStatus.PENDING) {
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.CANCELLED },
            });

            await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                    bookingStatus: BookingStatus.CANCELLED,
                    cancelledAt: new Date(),
                    cancellationReason: "Payment cancelled by user",
                },
            });

            await tx.slot.update({
                where: { id: payment.booking.slotId },
                data: { status: SlotStatus.AVAILABLE },
            });
        });
    }

    return {
        redirectUrl: `${env.CLIENT_URL}/booking/cancel?bookingId=${payment?.bookingId || "unknown"}`,
    };
};

export const PaymentService = {
    initSSLCommerzSession,
    handleSuccess,
    handleIPN,
    handleFail,
    handleCancel
};
