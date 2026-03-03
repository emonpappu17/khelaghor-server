import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import type { UserRole } from "../../generated/prisma/enums";

export const checkAuth =
    (...allowedRoles: UserRole[]) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                // const authorization = req.headers.authorization;

                // if (!authorization || !authorization.startsWith("Bearer ")) {
                //     throw new AppError("Unauthorized access", 401);
                // }

                // const token = authorization.split(" ")[1];

                const token = req?.headers.authorization || req?.cookies.accessToken;

                if (!token) {
                    throw new AppError("Unauthorized access", 401);
                }

                // Verify JWT
                const decoded = verifyAccessToken(token as string);

                // Check if user exists
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                });

                if (!user) {
                    throw new AppError("User does not exist", 404);
                }

                // Check if deleted
                if (user.isDeleted) {
                    throw new AppError("This account has been deleted", 403);
                }

                // Check if blocked
                if (user.status === "BLOCKED") {
                    throw new AppError("This account has been blocked", 403);
                }

                // Role check
                if (allowedRoles.length && !allowedRoles.includes(user.role)) {
                    throw new AppError("Forbidden access", 403);
                }

                // Attach user to request
                req.user = {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                }

                next();
            } catch (error) {
                next(error);
            }
        };