import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { SlotController } from "./slot.controller";
import { SlotValidation } from "./slot.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

const hostRoles = [UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN];

router.get("/:fieldId", SlotController.getSlots);

router.post(
  "/:fieldId",
  checkAuth(...hostRoles),
  validateRequest(SlotValidation.createSlotsSchema),
  SlotController.createSlots
);

router.patch(
  "/:fieldId/:slotId",
  checkAuth(...hostRoles),
  validateRequest(SlotValidation.updateSlotSchema),
  SlotController.updateSlot
);

router.delete(
  "/:fieldId/:slotId",
  checkAuth(...hostRoles),
  SlotController.deleteSlot
);

export const SlotRoutes = router;
