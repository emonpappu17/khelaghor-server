// import { Prisma } from "../../generated/prisma/client";

import { Prisma } from "../../generated/prisma/client";

// type TPrismaErrorResponse = {
//     statusCode: number;
//     message: string;
//     errors?: {
//         field: string;
//         message: string;
//     }[];
// };

// export const handlePrismaError = (
//     error: unknown
// ): TPrismaErrorResponse | null => {
//     // Known Prisma Client Errors
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         switch (error.code) {
//             case "P2002":
//                 return {
//                     statusCode: 409,
//                     message: "Duplicate field value",
//                     errors: [
//                         {
//                             field: (error.meta?.target as string[])?.join(", ") || "unknown",
//                             message: "This value already exists",
//                         },
//                     ],
//                 };

//             case "P2025":
//                 return {
//                     statusCode: 404,
//                     message: "Record not found",
//                 };

//             case "P2003":
//                 return {
//                     statusCode: 400,
//                     message: "Foreign key constraint failed",
//                 };

//             default:
//                 return {
//                     statusCode: 400,
//                     message: error.message,
//                 };
//         }
//     }

//     // Validation Error
//     if (error instanceof Prisma.PrismaClientValidationError) {
//         return {
//             statusCode: 400,
//             message: "Invalid database query",
//         };
//     }

//     return null;
// };





type TPrismaErrorResponse = {
    statusCode: number;
    message: string;
    errors?: {
        field: string;
        message: string;
    }[];
};

export const handlePrismaError = (
    error: any
): TPrismaErrorResponse | null => {

    // console.log('error.code==>', error?.code);
    // console.log('error.meta==>', error?.meta);
    // console.log('error.message==>', error?.message);
    // console.log('error.meta?.cause?.originalMessage ==>', error.meta?.cause);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002": // Unique constraint
                // const target = (error.meta?.target as string[])?.join(", ") || "field";

                let target: string | undefined;

                if (Array.isArray(error.meta?.target)) {
                    target = error.meta?.target.join(", ");
                } else {
                    const originalMessage = (error.meta?.driverAdapterError as any)?.cause?.originalMessage;
                    if (originalMessage) {
                        const match = originalMessage.match(/unique constraint "(.*?)"/);
                        if (match) {
                            target = match[1].replace(/.*_(\w+)_key$/, "$1"); // e.g. User_phone_key → phone
                        }
                    }
                }

                target = target || "field";
                return {
                    statusCode: 409,
                    message: "Duplicate Entry",
                    errors: [{
                        field: target,
                        message: `The value for ${target} is already in use.`
                    }],
                };

            case "P2025": // Not found
                return {
                    statusCode: 404,
                    message: (error.meta?.cause as string) || "Record not found.",
                };

            case "P2003": // Foreign key
                return {
                    statusCode: 400,
                    message: "Reference error: The related record does not exist.",
                };

            // --- CONNECTION/INFRASTRUCTURE ERRORS ---
            case "P1017": // Server closed the connection
                return {
                    statusCode: 503,
                    message: "Database connection was closed. Please try again.",
                };

            case "P1001": // Can't reach database server
                return {
                    statusCode: 503,
                    message: "Cannot reach the database server. Check your network or DB status.",
                };

            case "P1008": // Operations timed out
                return {
                    statusCode: 408,
                    message: "Database operation timed out.",
                };

            case "P1010": // Access Denied
                return {
                    statusCode: 403,
                    message: "Database access denied. Please check your database credentials and permissions.",
                };

            default:
                return {
                    statusCode: 500,
                    message: `Internal Database Error (${error.code})`,
                };
        }
    }

    // Validation/Initialization
    if (error instanceof Prisma.PrismaClientValidationError) {
        return { statusCode: 400, message: "Invalid query parameters provided to Prisma." };
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        return { statusCode: 503, message: "Failed to initialize database connection." };
    }

    return null;
};