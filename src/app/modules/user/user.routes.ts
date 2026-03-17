import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// Authenticated user endpoints
router.get("/me", checkAuth(), UserController.getMe);

router.patch(
    "/me",
    checkAuth(),
    validateRequest(UserValidation.updateProfileSchema),
    UserController.updateMe
);

router.delete("/me", checkAuth(), UserController.deleteMe);

// // admin-only endpoints
router.get(
    "/",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.listUsers
);

router.get(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.getUser
);

router.patch(
    "/:id/status",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(UserValidation.updateStatusSchema),
    UserController.updateUserStatus
);

router.patch(
    "/:id/role",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validateRequest(UserValidation.updateRoleSchema),
    UserController.updateUserRole
);

router.delete(
    "/:id",
    checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    UserController.deleteUser
);

export const UserRoutes = router;
