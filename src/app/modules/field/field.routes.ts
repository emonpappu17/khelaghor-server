import { Router } from "express";
import axios from "axios";
import { env } from "../../config/env";

const router = Router();

const API_KEY = env.BARIKOI_API_KEY;

router.get("/autocomplete", async (req, res) => {
    const query = req.query.q as string;

    if (!query || query.length < 3) {
        return res.json({ places: [] });
    }

    try {
        const response = await axios.get(
            "https://barikoi.xyz/v2/api/search/autocomplete/place",
            {
                params: {
                    api_key: API_KEY,
                    q: query,
                    // city: "dhaka",          // optional filter
                    sub_area: true,         // optional
                    // sub_district: true,     // optional
                },
            }
        );

        res.json(response.data);
    } catch (error: any) {
        console.error("Barikoi API error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch autocomplete" });
    }
});

// Reverse geocode route
router.get("/reverse-geocode", async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "latitude and longitude are required" });
    }

    try {
        const response = await axios.get(
            "https://barikoi.xyz/v2/api/search/reverse/geocode",
            {
                params: {
                    api_key: API_KEY,
                    latitude,
                    longitude,
                    address: true,
                    division: true,
                    district: true,
                    area: true,
                },
            }
        );
        res.json(response.data);
    } catch (error: any) {
        console.error("Barikoi Reverse Geocode error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch reverse geocode" });
    }
});

export const FieldRoutes = router;
