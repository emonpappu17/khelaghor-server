import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CancelBookingInput, CreateBookingInput } from "./booking.validation";
import sendResponse from "../../utils/sendResponse";
import { BookingService } from "./booking.service";
import pick from "../../utils/pick";

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

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const filters = pick(req.query, ["status"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await BookingService.getMyBookings(userId, filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
            result.bookings.length === 0
                ? "No bookings found"
                : "Bookings fetched successfully",
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
        },
        data: result.bookings,
    });
});


const getHostBookings = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const filters = pick(req.query, ["status"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await BookingService.getHostBookings(userId, filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
            result.bookings.length === 0
                ? "No bookings found"
                : "Host bookings fetched successfully",
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
        },
        data: result.bookings,
    });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    // const filters = pick(req.query, ["status"]);
    const filters = pick(req.query, [
        "searchTerm",
        "status",
        "paymentStatus",
        "sportType",
        "division",
        "area",
        "userId",
        "hostId",
        "fieldId",
        "startDate",
        "endDate",
        "minAmount",
        "maxAmount",
    ]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await BookingService.getAllBookings(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
            result.data.length === 0
                ? "No bookings found"
                : "Bookings fetched successfully",
        meta: result.meta,
        data: result.data,
    });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const bookingId = req.params.bookingId as string;
    const data = req.body as CancelBookingInput;

    const result = await BookingService.cancelBooking(userId, bookingId, data);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Booking cancelled successfully",
        data: result,
    });
});


export const BookingController = {
    createBooking,
    cancelBooking,
    getMyBookings,
    getHostBookings,
    getAllBookings
};
