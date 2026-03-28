import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { SlotController } from "./slot.controller";
import { SlotValidation } from "./slot.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

const hostRoles = [UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN];

router.get("/:fieldId/slots", SlotController.getSlots);

router.post(
  "/:fieldId/slots",
  checkAuth(...hostRoles),
  validateRequest(SlotValidation.createSlotSchema),
  SlotController.createSlot
);

router.post(
  "/:fieldId/slots/bulk",
  checkAuth(...hostRoles),
  validateRequest(SlotValidation.bulkCreateSlotsSchema),
  SlotController.bulkCreateSlots
);

router.patch(
  "/:fieldId/slots/:slotId",
  checkAuth(...hostRoles),
  validateRequest(SlotValidation.updateSlotSchema),
  SlotController.updateSlot
);

router.delete(
  "/:fieldId/slots/:slotId",
  checkAuth(...hostRoles),
  SlotController.deleteSlot
);

export const SlotRoutes = router;
