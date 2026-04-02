import { Router } from "express";
import { MapController } from "./map.controller";

const router = Router();

router.get("/autocomplete", MapController.autocomplete);
router.get("/reverse-geocode", MapController.reverseGeocode);

export const MapRoutes = router;
