import type { UserRole } from "../../generated/prisma/enums";

declare global {
    namespace Express {
        interface Request {
            authUser: {
                userId: string;
                email: string;
                role: UserRole;
            };
        }
    }
}

