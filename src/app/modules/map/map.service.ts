import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../errors/AppError";

const API_KEY = env.BARIKOI_API_KEY;

if (!API_KEY) {
  throw new AppError("BARIKOI_API_KEY not configured", 500);
}

const autocomplete = async (query: string) => {
  if (!query || query.trim().length < 3) {
    throw new AppError("Query must be at least 3 characters", 400);
  }

  try {
    const response = await axios.get("https://barikoi.xyz/v2/api/search/autocomplete/place", {
      params: {
        api_key: API_KEY,
        q: query,
        sub_area: true,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Barikoi autocomplete failed:", error.response?.data || error.message);
    throw new AppError("Failed to fetch autocomplete results", 502);
  }
};

const reverseGeocode = async (latitude: string, longitude: string) => {
  if (!latitude || !longitude) {
    throw new AppError("latitude and longitude provide", 400);
  }

  try {
    const response = await axios.get("https://barikoi.xyz/v2/api/search/reverse/geocode", {
      params: {
        api_key: API_KEY,
        latitude,
        longitude,
        address: true,
        division: true,
        district: true,
        area: true,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Barikoi reverse geocode failed:", error.response?.data || error.message);
    throw new AppError("Failed to fetch reverse geocode", 502);
  }
};

export const MapService = {
  autocomplete,
  reverseGeocode,
};
