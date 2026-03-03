import jwt from "jsonwebtoken";

type TJwtErrorResponse = {
    statusCode: number;
    message: string;
};

export const handleJwtError = (
    error: unknown
): TJwtErrorResponse | null => {
    if (error instanceof jwt.TokenExpiredError) {
        return {
            statusCode: 401,
            message: "Token has expired",
        };
    }

    if (error instanceof jwt.JsonWebTokenError) {
        return {
            statusCode: 401,
            message: "Invalid token",
        };
    }

    if (error instanceof jwt.NotBeforeError) {
        return {
            statusCode: 401,
            message: "Token not active yet",
        };
    }

    return null;
};