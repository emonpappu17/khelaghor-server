import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";
import pick from "../../utils/pick";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const filters = pick(req.query, ["isRead"]);
    const options = pick(req.query, ["page", "limit"]);

    const result = await NotificationService.getMyNotifications(
        userId,
        filters,
        options
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
            result.notifications.length === 0
                ? "No notifications found"
                : "Notifications fetched successfully",
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
        },
        data: result.notifications,
    });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;

    const result = await NotificationService.getUnreadCount(userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Unread count fetched",
        data: result,
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const notificationId = req.params.id as string;

    const notification = await NotificationService.markAsRead(
        userId,
        notificationId
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Notification marked as read",
        data: notification,
    });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;

    const result = await NotificationService.markAllAsRead(userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `${result.markedCount} notification(s) marked as read`,
        data: result,
    });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const notificationId = req.params.id as string;

    const result = await NotificationService.deleteNotification(
        userId,
        notificationId
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: result.message,
        data: null,
    });
});

export const NotificationController = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
