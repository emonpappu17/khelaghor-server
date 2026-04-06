import { z } from "zod";

const createReviewSchema = z.object({
    fieldId: z.uuid("Invalid field ID"),
    rating: z
        .number()
        .int("Rating must be a whole number")
        .min(1, "Rating must be at least 1")
        .max(5, "Rating cannot exceed 5"),
    comment: z
        .string()
        .min(10, "Comment must be at least 10 characters")
        .max(1000, "Comment cannot exceed 1000 characters"),
});

const updateReviewSchema = z.object({
    rating: z
        .number()
        .int("Rating must be a whole number")
        .min(1, "Rating must be at least 1")
        .max(5, "Rating cannot exceed 5")
        .optional(),
    comment: z
        .string()
        .min(10, "Comment must be at least 10 characters")
        .max(1000, "Comment cannot exceed 1000 characters")
        .optional(),
}).refine(
    (data) => data.rating !== undefined || data.comment !== undefined,
    { message: "At least one of rating or comment must be provided" }
);

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const ReviewValidation = {
    createReviewSchema,
    updateReviewSchema,
};
