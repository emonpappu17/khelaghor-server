import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { handleZodError } from "../errors/handleZodError";

export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors: unknown = undefined;

    // ✅ Handle Custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // ✅ Handle Zod Validation Error
    if (err instanceof ZodError) {
        const formatted = handleZodError(err);
        statusCode = formatted.statusCode;
        message = formatted.message;
        errors = formatted.errors;
    }

    // Log everything
    console.error("🔥 Error:", err);

    const response: Record<string, unknown> = {
        success: false,
        message,
    };

    if (errors) response.errors = errors;

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};