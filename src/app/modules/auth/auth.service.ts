import { AuthProvider, UserRole } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import bcrypt from 'bcrypt';
import { RegisterInput } from "./auth.validation";

const register = async (data: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                role: data.role as UserRole,
                auths: {
                    create: {
                        provider: AuthProvider.credentials,
                        providerId: data.email
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        if (data.role === UserRole.HOST) {
            await tx.host.create({
                data: {
                    userId: user.id,
                    businessName: data.business_name,
                    nidNumber: data.nid_number
                },
            });
        }

        return user;
    });

    return result;
};

export const AuthService = { register };
