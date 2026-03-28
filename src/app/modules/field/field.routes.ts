import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { FieldController } from "./field.controller";
import { FieldValidation } from "./field.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// Public field endpoints
router.get("/", FieldController.listFields);
router.get("/:id", FieldController.getField);

// Host/admin endpoints
const hostRoles = [UserRole.HOST, UserRole.ADMIN, UserRole.SUPER_ADMIN];

router.post(
  "/",
  checkAuth(UserRole.HOST),
  validateRequest(FieldValidation.createFieldSchema),
  FieldController.createField
);

router.patch(
  "/:id",
  checkAuth(...hostRoles),
  validateRequest(FieldValidation.updateFieldSchema),
  FieldController.updateField
);

router.delete("/:id", checkAuth(...hostRoles), FieldController.removeField);

export const FieldRoutes = router;
