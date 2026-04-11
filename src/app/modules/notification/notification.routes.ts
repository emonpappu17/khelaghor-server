import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { NotificationController } from "./notification.controller";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

const allRoles = [UserRole.USER, UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN];

router.get(
    "/",
    checkAuth(...allRoles),
    NotificationController.getMyNotifications
);

router.get(
    "/unread-count",
    checkAuth(...allRoles),
    NotificationController.getUnreadCount
);

router.patch(
    "/read-all",
    checkAuth(...allRoles),
    NotificationController.markAllAsRead
);

router.patch(
    "/:id/read",
    checkAuth(...allRoles),
    NotificationController.markAsRead
);

router.delete(
    "/:id",
    checkAuth(...allRoles),
    NotificationController.deleteNotification
);

export const NotificationRoutes = router;
