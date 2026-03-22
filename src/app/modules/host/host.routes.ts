import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { HostController } from "./host.controller";
import { HostValidation } from "./host.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// Host self-service
router.post(
  "/apply",
  checkAuth(),
  validateRequest(HostValidation.applyHostSchema),
  HostController.apply
);

router.get("/me", checkAuth(), HostController.getMine);

router.patch(
  "/me",
  checkAuth(),
  validateRequest(HostValidation.updateHostSchema),
  HostController.updateMine
);

// Admin endpoints
router.get(
  "/",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  HostController.listHosts
);

router.get(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  HostController.getHost
);

router.patch(
  "/:id/approve",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  HostController.approveHost
);

export const HostRoutes = router;
