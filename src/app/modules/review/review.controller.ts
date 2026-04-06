import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CreateReviewInput } from "./review.validation";
import sendResponse from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
import pick from "../../utils/pick";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const data = req.body as CreateReviewInput;

    const review = await ReviewService.createReview(userId, data);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Review submitted successfully",
        data: review,
    });
});

const getFieldReviews = catchAsync(async (req: Request, res: Response) => {
    const fieldId = req.params.fieldId as string;
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await ReviewService.getFieldReviews(fieldId, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
            result.reviews.length === 0
                ? "No reviews found"
                : "Reviews fetched successfully",
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
        },
        data: {
            averageRating: result.averageRating,
            totalReviews: result.totalReviews,
            reviews: result.reviews,
        },
    });
});

export const ReviewController = {
    createReview,
    getFieldReviews
};
