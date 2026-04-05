import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { UserRole } from "../../../generated/prisma/enums";
import { BookingValidation } from "./booking.validation";
import { BookingController } from "./booking.controller";

const router = Router();

router.post(
    "/",
    checkAuth(UserRole.USER, UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(BookingValidation.createBookingSchema),
    BookingController.createBooking
);

router.get(
    "/my",
    checkAuth(UserRole.USER, UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    BookingController.getMyBookings
);

router.get(
    "/host",
    checkAuth(UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    BookingController.getHostBookings
);

router.post(
    "/:bookingId/cancel",
    checkAuth(UserRole.USER, UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(BookingValidation.cancelBookingSchema),
    BookingController.cancelBooking
);

export const BookingRoutes = router;
