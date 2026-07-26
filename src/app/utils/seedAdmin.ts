import { UserRole } from "../../generated/prisma/enums";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

export const seedUsers = async () => {
    try {
        const users = [
            {
                name: "Super admin",
                email: env.SUPER_ADMIN_EMAIL,
                password: env.SUPER_ADMIN_PASSWORD,
                role: UserRole.SUPER_ADMIN,
                isVerified: true,
            },
            {
                name: "Hasan Mahmud",
                email: "hasan.mahmud@gmail.com",
                password: "asdfasdf",
                role: UserRole.USER,
                isVerified: true,
            },
            {
                name: "Rahim Ahmed",
                email: "rahim.ahmed@gmail.com",
                password: "asdfasdf",
                role: UserRole.HOST,
                isVerified: true,
                hostProfile: {
                    businessName: "Rahim Sports Center",
                    nidNumber: "1234567890",
                    isApproved: true,
                },
            },
        ];

        for (const userData of users) {
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email },
                include: {
                    auths: true,
                    hostProfile: true,
                },
            });

            const hashedPassword = await bcrypt.hash(
                userData.password,
                Number(env.BCRYPT_SALT_ROUNDS)
            );

            if (!existingUser) {
                const createdUser = await prisma.user.create({
                    data: {
                        name: userData.name,
                        role: userData.role,
                        email: userData.email,
                        password: hashedPassword,
                        isVerified: userData.isVerified,
                        auths: {
                            create: [
                                {
                                    provider: "credentials",
                                    providerId: userData.email,
                                },
                            ],
                        },
                        ...(userData.role === UserRole.HOST
                            ? {
                                hostProfile: {
                                    create: {
                                        businessName:
                                            userData.hostProfile?.businessName,
                                        nidNumber: userData.hostProfile?.nidNumber,
                                        isApproved:
                                            userData.hostProfile?.isApproved ??
                                            true,
                                    },
                                },
                            }
                            : {}),
                    },
                    include: {
                        auths: true,
                        hostProfile: true,
                    },
                });

                console.log(`${userData.email} created successfully`);
                console.log(createdUser);
                continue;
            }

            const hasCredentialsAuth = existingUser.auths.some(
                (auth) => auth.provider === "credentials"
            );

            if (!hasCredentialsAuth) {
                await prisma.auth.create({
                    data: {
                        provider: "credentials",
                        providerId: userData.email,
                        userId: existingUser.id,
                    },
                });

                console.log(`Credentials auth created for ${userData.email}`);
            }

            if (
                userData.role === UserRole.HOST &&
                !existingUser.hostProfile
            ) {
                await prisma.host.create({
                    data: {
                        userId: existingUser.id,
                        businessName: userData.hostProfile?.businessName,
                        nidNumber: userData.hostProfile?.nidNumber,
                        isApproved: userData.hostProfile?.isApproved ?? true,
                    },
                });

                console.log(`Host profile created for ${userData.email}`);
            }

            console.log(`${userData.email} already exists or updated`);
        }

        console.log("Seeding completed successfully!");
    } catch (error) {
        console.log(error);
    }
};