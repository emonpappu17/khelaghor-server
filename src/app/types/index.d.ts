import type { UserRole } from "../../generated/prisma/enums";

declare global {
    namespace Express {
        interface Request {
            user: {
                userId: string;
                email: string;
                role: UserRole;
            };
        }
    }
}

