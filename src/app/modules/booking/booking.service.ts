import { addMinutes } from "date-fns";
import { BookingStatus, PaymentStatus, PaymentType, SlotStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { CancelBookingInput, CreateBookingInput } from "./booking.validation";
import { BOOKING_EXPIRY_MINUTES, PARTIAL_PAYMENT_PERCENTAGE, PLATFORM_FEE_PERCENTAGE } from "./booking.constants";
import { PaymentService } from "../payment/payment.service";

const generateTransactionId = (bookingId: string): string => {
    const short = bookingId.split("-")[0];
    const ts = Date.now();
    return `KH-${short}-${ts}`;
};

const createBooking = async (userId: string, data: CreateBookingInput) => {
    const result = await prisma.$transaction(
        async (tx) => {
            // 1. Fetch slot with field data
            const slot = await tx.slot.findUnique({
                where: { id: data.slotId },
                include: {
                    field: {
                        include: { host: true },
                    },
                },
            });

            if (!slot) {
                throw new AppError("Slot not found", 404);
            }

            // 2. Verify slot is available
            if (slot.status !== SlotStatus.AVAILABLE) {
                throw new AppError("This slot is no longer available", 409);
            }

            // 3. Verify slot date is in the future
            const now = new Date();
            const slotDate = new Date(slot.date);
            slotDate.setHours(23, 59, 59, 999); // end of slot day
            if (slotDate < now) {
                throw new AppError("Cannot book a slot in the past", 400);
            }

            // 4. Verify field is active
            if (slot.field.status !== "ACTIVE") {
                throw new AppError("This field is not currently active", 400);
            }

            // 5. Check no active booking exists for this slot (PENDING or CONFIRMED)
            const existingActiveBooking = await tx.booking.findFirst({
                where: {
                    slotId: data.slotId,
                    bookingStatus: {
                        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
                    },
                },
            });

            if (existingActiveBooking) {
                throw new AppError(
                    "This slot already has an active booking",
                    409
                );
            }

            // 6. Lock the slot → BOOKED
            await tx.slot.update({
                where: { id: data.slotId },
                data: { status: SlotStatus.BOOKED },
            });

            // 7. Calculate amounts
            const totalAmount = slot.pricePerSlot;
            const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENTAGE * 100) / 100;
            const hostAmount = Math.round((totalAmount - platformFee) * 100) / 100;

            const paymentAmount =
                data.paymentType === PaymentType.FULL
                    ? totalAmount
                    : Math.round(totalAmount * PARTIAL_PAYMENT_PERCENTAGE * 100) / 100;

            const dueAmount = Math.round((totalAmount - paymentAmount) * 100) / 100;

            // 8. Calculate expiry
            const expiresAt = addMinutes(now, BOOKING_EXPIRY_MINUTES);

            // 9. Create booking
            const booking = await tx.booking.create({
                data: {
                    slotId: data.slotId,
                    userId,
                    totalAmount,
                    paidAmount: 0,
                    dueAmount: dueAmount,
                    // dueAmount: totalAmount,
                    platformFee,
                    hostAmount,
                    bookingStatus: BookingStatus.PENDING,
                    expiresAt,
                },
            });

            // 10. Generate unique transaction ID
            const transactionId = generateTransactionId(booking.id);

            // 11. Create payment record
            const payment = await tx.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: paymentAmount,
                    currency: "BDT",
                    type: data.paymentType,
                    status: PaymentStatus.PENDING,
                    transactionId,
                    expiresAt,
                },
            });

            // 12. Fetch user info for SSLCommerz
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new AppError("User not found", 404);
            }

            return { booking, payment, user, slot };
        },
        { isolationLevel: "Serializable" }
    );

    // 13. Initiate SSLCommerz session (outside transaction to avoid holding locks)
    const sslResult = await PaymentService.initSSLCommerzSession(
        result.payment,
        result.booking,
        result.user,
        result.slot
    );

    // 14. Update payment with SSLCommerz session info
    const updatedPayment = await prisma.payment.update({
        where: { id: result.payment.id },
        data: {
            sessionKey: sslResult.sessionKey,
            gatewayPageURL: sslResult.gatewayPageURL,
        },
    });

    return {
        booking: result.booking,
        payment: updatedPayment,
        paymentUrl: sslResult.gatewayPageURL,
    };
};

const cancelBooking = async (
    userId: string,
    bookingId: string,
    data: CancelBookingInput
) => {
    return await prisma.$transaction(
        async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { payments: true },
            });

            if (!booking) {
                throw new AppError("Booking not found", 404);
            }

            if (booking.userId !== userId) {
                throw new AppError(
                    "You don't have permission to cancel this booking",
                    403
                );
            }

            if (
                booking.bookingStatus === BookingStatus.CANCELLED ||
                booking.bookingStatus === BookingStatus.COMPLETED
            ) {
                throw new AppError(
                    `Cannot cancel a booking that is already ${booking.bookingStatus.toLowerCase()}`,
                    400
                );
            }

            const now = new Date();
            const reason =
                data.reason || "Cancelled by user";

            // Cancel all PENDING payments
            await tx.payment.updateMany({
                where: {
                    bookingId: booking.id,
                    status: PaymentStatus.PENDING,
                },
                data: {
                    status: PaymentStatus.CANCELLED,
                },
            });

            // If booking was CONFIRMED (already paid), mark payment for refund review
            if (booking.bookingStatus === BookingStatus.CONFIRMED) {
                await tx.payment.updateMany({
                    where: {
                        bookingId: booking.id,
                        status: PaymentStatus.COMPLETED,
                    },
                    data: {
                        status: PaymentStatus.REFUNDED,
                    },
                });
            }

            // Cancel the booking
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    bookingStatus: BookingStatus.CANCELLED,
                    cancelledAt: now,
                    cancellationReason: reason,
                },
            });

            // Free the slot
            await tx.slot.update({
                where: { id: booking.slotId },
                data: { status: SlotStatus.AVAILABLE },
            });

            return updatedBooking;
        },
        { isolationLevel: "Serializable" }
    );
};

export const BookingService = {
    createBooking,
    cancelBooking
};
