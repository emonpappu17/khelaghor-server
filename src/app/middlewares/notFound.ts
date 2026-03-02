import type { Request, Response } from "express";
import sendResponse from "../utils/sendResponse";

export const notFound = (req: Request, res: Response) => {
    sendResponse(res, {
        statusCode: 404,
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};