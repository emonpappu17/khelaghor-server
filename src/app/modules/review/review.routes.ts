import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewValidation } from "./review.validation";
import { UserRole } from "../../../generated/prisma/enums";
import { ReviewController } from "./review.controller";

const router = Router();

router.post(
    "/",
    checkAuth(UserRole.USER),
    validateRequest(ReviewValidation.createReviewSchema),
    ReviewController.createReview
);


export const ReviewRoutes = router;
