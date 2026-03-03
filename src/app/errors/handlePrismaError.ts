import { Prisma } from "../../generated/prisma/client";

type TPrismaErrorResponse = {
    statusCode: number;
    message: string;
    errors?: {
        field: string;
        message: string;
    }[];
};

export const handlePrismaError = (
    error: unknown
): TPrismaErrorResponse | null => {
    // Known Prisma Client Errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                return {
                    statusCode: 409,
                    message: "Duplicate field value",
                    errors: [
                        {
                            field: (error.meta?.target as string[])?.join(", ") || "unknown",
                            message: "This value already exists",
                        },
                    ],
                };

            case "P2025":
                return {
                    statusCode: 404,
                    message: "Record not found",
                };

            case "P2003":
                return {
                    statusCode: 400,
                    message: "Foreign key constraint failed",
                };

            default:
                return {
                    statusCode: 400,
                    message: error.message,
                };
        }
    }

    // Validation Error
    if (error instanceof Prisma.PrismaClientValidationError) {
        return {
            statusCode: 400,
            message: "Invalid database query",
        };
    }

    return null;
};