import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { calculatePagination } from "../../utils/calculatePagination";
import type { TPaginationOptions } from "../../types/pagination";

const getMyNotifications = async (
    userId: string,
    filters: { isRead?: string },
    options: TPaginationOptions
) => {
    const { page, limit, skip } = calculatePagination(options);

    const where: { recipientId: string; isRead?: boolean } = {
        recipientId: userId,
    };

    // Apply isRead filter if provided
    if (filters.isRead === "true") {
        where.isRead = true;
    } else if (filters.isRead === "false") {
        where.isRead = false;
    }

    const [total, notifications] = await prisma.$transaction([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" }, // Always newest first
        }),
    ]);

    return { total, page, limit, notifications };
};

const getUnreadCount = async (userId: string) => {
    const count = await prisma.notification.count({
        where: {
            recipientId: userId,
            isRead: false,
        },
    });

    return { unreadCount: count };
};

const markAsRead = async (userId: string, notificationId: string) => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    if (notification.recipientId !== userId) {
        throw new AppError(
            "You don't have permission to access this notification",
            403
        );
    }

    // Idempotent — skip if already read
    if (notification.isRead) {
        return notification;
    }

    const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return updated;
};

const markAllAsRead = async (userId: string) => {
    const result = await prisma.notification.updateMany({
        where: {
            recipientId: userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return { markedCount: result.count };
};

const deleteNotification = async (userId: string, notificationId: string) => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new AppError("Notification not found", 404);
    }

    if (notification.recipientId !== userId) {
        throw new AppError(
            "You don't have permission to delete this notification",
            403
        );
    }

    await prisma.notification.delete({
        where: { id: notificationId },
    });

    return { message: "Notification deleted successfully" };
};

export const NotificationService = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
