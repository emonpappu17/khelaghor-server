import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { handleZodError } from "../errors/handleZodError";
import { handlePrismaError } from "../errors/handlePrismaError";
import { handleJwtError } from "../errors/handleJwtError";

export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors;

    // Prisma
    const prismaError = handlePrismaError(err);
    if (prismaError) {
        statusCode = prismaError.statusCode;
        message = prismaError.message;
        errors = prismaError.errors;
    }

    // JWT
    else {
        const jwtError = handleJwtError(err);
        if (jwtError) {
            statusCode = jwtError.statusCode;
            message = jwtError.message;
        }

        // Zod
        else if (err instanceof ZodError) {
            const formatted = handleZodError(err);
            statusCode = formatted.statusCode;
            message = formatted.message;
            errors = formatted.errors;
        }

        // AppError
        else if (err instanceof AppError) {
            statusCode = err.statusCode;
            message = err.message;
        }
    }

    console.error("🔥 Error:", err);

    const response: Record<string, unknown> = {
        success: false,
        message,
    };

    if (errors) response.errors = errors;
    if (process.env.NODE_ENV === "development") {
        response.stack = err instanceof Error ? err.stack : undefined;
    }

    console.log('error res==>', response);

    res.status(statusCode).json(response);
};