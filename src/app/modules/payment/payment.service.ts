import { env } from "../../config/env";
import { createSSLCommerzSession } from "../../config/sslcommerz";
import { prisma } from "../../lib/prisma";
import { SSLCommerzSessionParams } from "../../types/sslcommerz.types";
import { SSLCOMMERZ_PRODUCT } from "./payment.constants";

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


export const PaymentService = {
    initSSLCommerzSession,
    handleSuccess
};
