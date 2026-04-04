import { Router } from "express";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/ipn", PaymentController.handleIPN);

router.post("/success", PaymentController.handleSuccess);

router.post("/fail", PaymentController.handleFail);

router.post("/cancel", PaymentController.handleCancel);


export const PaymentRoutes = router;
