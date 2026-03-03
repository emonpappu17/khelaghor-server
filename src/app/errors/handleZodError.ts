import { ZodError } from "zod";

export const handleZodError = (error: ZodError) => {
    const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
    }));

    return {
        statusCode: 400,
        message: "Validation Error",
        errors: formattedErrors,
    };
};