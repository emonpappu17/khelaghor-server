import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CreateReviewInput } from "./review.validation";
import sendResponse from "../../utils/sendResponse";
import { ReviewService } from "./review.service";

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

export const ReviewController = {
    createReview,
};
