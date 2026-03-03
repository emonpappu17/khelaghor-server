import type { ErrorRequestHandler } from "express";
import sendResponse from "../utils/sendResponse";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    let statusCode = 500;
    let message = "Internal Server Error";

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    console.error("🔥 Error:", err);

    sendResponse(res, {
        statusCode,
        success: false,
        message: err.message || "Internal Server Error",
        data:
            process.env.NODE_ENV === "development"
                ? { stack: err.stack }
                : undefined,
    });
};