import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MapService } from "./map.service";

const autocomplete = catchAsync(async (req: Request, res: Response) => {

  const data = await MapService.autocomplete(req.query.q as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Autocomplete results fetched successfully",
    data,
  });
});

const reverseGeocode = catchAsync(async (req: Request, res: Response) => {

  const data = await MapService.reverseGeocode(req.query.latitude as string, req.query.longitude as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reverse geocode result fetched successfully",
    data,
  });
});

export const MapController = {
  autocomplete,
  reverseGeocode,
};
