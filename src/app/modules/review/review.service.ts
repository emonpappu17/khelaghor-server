import { BookingStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { calculatePagination } from "../../utils/calculatePagination";
import { CreateReviewInput } from "./review.validation";

const recalculateFieldRating = async (
    fieldId: string,
    tx?: any
) => {
    const db = tx || prisma;

    const aggregate = await db.review.aggregate({
        where: { fieldId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await db.field.update({
        where: { id: fieldId },
        data: {
            averageRating: Math.round((aggregate._avg.rating || 0) * 100) / 100,
            totalReviews: aggregate._count.rating,
        },
    });
};

const createReview = async (userId: string, data: CreateReviewInput) => {
    return await prisma.$transaction(
        async (tx) => {

            const field = await tx.field.findUnique({
                where: { id: data.fieldId },
                include: { host: true },
            });

            if (!field) {
                throw new AppError("Field not found", 404);
            }

            if (field.host.userId === userId) {
                throw new AppError("You cannot review your own field", 403);
            }

            const completedBooking = await tx.booking.findFirst({
                where: {
                    userId,
                    bookingStatus: BookingStatus.COMPLETED,
                    slot: {
                        fieldId: data.fieldId,
                    },
                },
            });

            if (!completedBooking) {
                throw new AppError(
                    "You can only review a field after completing a booking",
                    403
                );
            }

            const existingReview = await tx.review.findUnique({
                where: {
                    userId_fieldId: {
                        userId,
                        fieldId: data.fieldId,
                    },
                },
            });

            if (existingReview) {
                throw new AppError(
                    "You have already reviewed this field. You can update your existing review instead.",
                    409
                );
            }

            const review = await tx.review.create({
                data: {
                    userId,
                    fieldId: data.fieldId,
                    rating: data.rating,
                    comment: data.comment,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            });

            // Recalculate field rating
            await recalculateFieldRating(data.fieldId, tx);

            return review;
        },
        { isolationLevel: "Serializable" }
    );
};

const getFieldReviews = async (
    fieldId: string,
    options: TPaginationOptions
) => {
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
        throw new AppError("Field not found", 404);
    }

    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const where = { fieldId };

    const [total, reviews] = await prisma.$transaction([
        prisma.review.count({ where }),
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        }),
    ]);

    return {
        total,
        page,
        limit,
        averageRating: field.averageRating,
        totalReviews: field.totalReviews,
        reviews,
    };
};


export const ReviewService = {
    createReview,
    getFieldReviews
};