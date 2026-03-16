import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

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
// router.get("/", checkAuth("ADMIN", "SUPER_ADMIN"), UserController.listUsers);
// router.get("/:id", checkAuth("ADMIN", "SUPER_ADMIN"), UserController.getUser);
// router.patch(
//   "/:id/status",
//   checkAuth("ADMIN", "SUPER_ADMIN"),
//   validateRequest(UserValidation.updateStatusSchema),
//   UserController.updateUserStatus
// );
// router.patch(
//   "/:id/role",
//   checkAuth("ADMIN", "SUPER_ADMIN"),
//   validateRequest(UserValidation.updateRoleSchema),
//   UserController.updateUserRole
// );
// router.delete("/:id", checkAuth("ADMIN", "SUPER_ADMIN"), UserController.deleteUser);

export const UserRoutes = router;
