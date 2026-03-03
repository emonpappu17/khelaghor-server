import { UserRole } from "../../generated/prisma/enums";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await prisma.user.findUnique({
            where: { email: env.SUPER_ADMIN_EMAIL },
        });

        if (isSuperAdminExist) {
            console.log("Super Admin Already Exists!");
            return;
        }

        console.log("Trying to create Super Admin...");

        const hashedPassword = await bcrypt.hash(
            env.SUPER_ADMIN_PASSWORD,
            Number(env.BCRYPT_SALT_ROUNDS)
        );

        const superAdmin = await prisma.user.create({
            data: {
                name: "Super admin",
                role: UserRole.SUPER_ADMIN,
                email: env.SUPER_ADMIN_EMAIL,
                password: hashedPassword,
                isVerified: true,
                auths: {
                    create: [
                        {
                            provider: "credentials",
                            providerId: env.SUPER_ADMIN_EMAIL,
                        },
                    ],
                },
            },
            include: {
                auths: true,
            },
        });

        console.log("Super Admin Created Successfully! \n");
        console.log(superAdmin);
    } catch (error) {
        console.log(error);
    }
};