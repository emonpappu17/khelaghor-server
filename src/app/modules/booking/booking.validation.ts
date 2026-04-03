import { z } from "zod";

const createBookingSchema = z.object({
    slotId: z.uuid("Invalid slot ID"),
    paymentType: z.enum(["FULL", "PARTIAL"], {
        message: "Payment type must be FULL or PARTIAL",
    }),
});

const cancelBookingSchema = z.object({
    reason: z
        .string()
        .min(1, "Reason cannot be empty")
        .max(500, "Reason is too long")
        .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const BookingValidation = {
    createBookingSchema,
    cancelBookingSchema,
};
