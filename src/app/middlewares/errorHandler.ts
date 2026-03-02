import type { ErrorRequestHandler } from "express";
import sendResponse from "../utils/sendResponse";

export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    const statusCode = (err as any)?.statusCode || 500;

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