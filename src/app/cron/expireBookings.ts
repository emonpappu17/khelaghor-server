import { BookingStatus, PaymentStatus, SlotStatus } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";

const BATCH_SIZE = 50;

export const expireUnpaidBookings = async (): Promise<void> => {
    try {
        const now = new Date();

        // Find expired PENDING bookings
        const expiredBookings = await prisma.booking.findMany({
            where: {
                bookingStatus: BookingStatus.PENDING,
                expiresAt: { lt: now },
            },
            select: {
                id: true,
                slotId: true,
            },
            take: BATCH_SIZE,
        });

        if (expiredBookings.length === 0) {
            return;
        }

        console.log(
            `[CRON] Found ${expiredBookings.length} expired booking(s). Processing...`
        );

        let processedCount = 0;
        let errorCount = 0;

        // Process each booking individually to isolate failures
        for (const booking of expiredBookings) {
            try {
                await prisma.$transaction(
                    async (tx) => {
                        // Re-check booking status inside transaction (IPN might have processed it)
                        const freshBooking = await tx.booking.findUnique({
                            where: { id: booking.id },
                        });

                        if (
                            !freshBooking ||
                            freshBooking.bookingStatus !== BookingStatus.PENDING
                        ) {
                            // Already processed by IPN or another cron run
                            return;
                        }

                        // Cancel booking
                        await tx.booking.update({
                            where: { id: booking.id },
                            data: {
                                bookingStatus: BookingStatus.CANCELLED,
                                cancelledAt: now,
                                cancellationReason:
                                    "Payment timeout - automatically expired",
                            },
                        });

                        // Fail all pending payments for this booking
                        await tx.payment.updateMany({
                            where: {
                                bookingId: booking.id,
                                status: PaymentStatus.PENDING,
                            },
                            data: {
                                status: PaymentStatus.FAILED,
                            },
                        });

                        // Free the slot
                        await tx.slot.update({
                            where: { id: booking.slotId },
                            data: { status: SlotStatus.AVAILABLE },
                        });
                    },
                    { isolationLevel: "Serializable" }
                );

                processedCount++;
            } catch (err) {
                // Log but don't stop — continue processing other bookings
                console.error(
                    `[CRON] Failed to expire booking ${booking.id}:`,
                    err
                );
                errorCount++;
            }
        }

        console.log(
            `[CRON] Expired ${processedCount} booking(s), ${errorCount} error(s).`
        );
    } catch (err) {
        console.error("[CRON] expireUnpaidBookings failed:", err);
    }
};
