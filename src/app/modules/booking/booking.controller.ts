import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CreateBookingInput } from "./booking.validation";
import sendResponse from "../../utils/sendResponse";
import { BookingService } from "./booking.service";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const data = req.body as CreateBookingInput;

    const result = await BookingService.createBooking(userId, data);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Booking created. Please complete payment.",
        data: {
            booking: result.booking,
            payment: result.payment,
            paymentUrl: result.paymentUrl,
        },
    });
});


export const BookingController = {
    createBooking,
};
