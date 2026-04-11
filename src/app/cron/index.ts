import cron from "node-cron";
import { expireUnpaidBookings } from "./expireBookings";
import { cleanupOldNotifications } from "./cleanupNotification";

/**
 * Initialize all cron jobs.
 * Call this once after the server starts.
 */
export const startCronJobs = (): void => {
    // Expire unpaid bookings — every 2 minutes
    cron.schedule("*/2 * * * *", async () => {
        console.log("[CRON] Running: expireUnpaidBookings");
        await expireUnpaidBookings();
    });

    // Cleanup old read notifications — daily at 3:00 AM
    cron.schedule("0 3 * * *", async () => {
        console.log("[CRON] Running: cleanupOldNotifications");
        await cleanupOldNotifications();
    });

    console.log("⏰ Cron jobs initialized");
};
