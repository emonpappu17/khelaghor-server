import { prisma } from "../lib/prisma";

const RETENTION_DAYS = 30;

export const cleanupOldNotifications = async (): Promise<void> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

        const result = await prisma.notification.deleteMany({
            where: {
                isRead: true,
                createdAt: { lt: cutoffDate },
            },
        });

        if (result.count > 0) {
            console.log(
                `[CRON] Cleaned up ${result.count} old read notification(s).`
            );
        }
    } catch (err) {
        console.error("[CRON] cleanupOldNotifications failed:", err);
    }
};
