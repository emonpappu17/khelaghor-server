import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { prisma } from "../lib/prisma";
import { AuthProvider, UserRole, UserStatus } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { AppError } from "../errors/AppError";

type UserWithAuths = Prisma.UserGetPayload<{ include: { auths: true } }>;

passport.use(
    new GoogleStrategy(
        {
            clientID: env.GOOGLE_CLIENT_ID || "",
            clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            callbackURL: env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                if (!profile.emails || profile.emails.length === 0) {
                    return done(new Error("No email found from Google account"), false);
                }

                const email = profile.emails[0].value;
                const name = profile.displayName || "Google User";
                const avatar =
                    profile.photos && profile.photos.length > 0
                        ? profile.photos[0].value
                        : undefined;
                const googleId = profile.id;

                let user: UserWithAuths | null = await prisma.user.findUnique({
                    where: { email },
                    include: { auths: true },
                });

                if (user) {
                    if (user.isDeleted) {
                        return done(new AppError("This account has been deleted", 403), false);
                    }
                    if (user.status !== UserStatus.ACTIVE) {
                        return done(new AppError(`Account is ${user.status}`, 403), false);
                    }
                    if (!user.isVerified) {
                        return done(new AppError("Account email not verified", 403), false);
                    }

                    const existingAuth = user.auths.find(
                        (auth) => auth.provider === AuthProvider.google
                    );
                    if (!existingAuth) {
                        await prisma.auth.create({
                            data: {
                                provider: AuthProvider.google,
                                providerId: googleId,
                                userId: user.id,
                            },
                        });
                    }

                    if (!user.avatar && avatar) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { avatar },
                            include: { auths: true },
                        });
                    }

                    return done(null, user);
                } else {
                    user = await prisma.$transaction(async (tx) => {
                        const newUser = await tx.user.create({
                            data: {
                                name,
                                email,
                                role: UserRole.USER, 
                                avatar,
                                isVerified: true,
                            },
                        });

                        await tx.auth.create({
                            data: {
                                provider: AuthProvider.google,
                                providerId: googleId,
                                userId: newUser.id,
                            },
                        });

                        return tx.user.findUnique({
                            where: { id: newUser.id },
                            include: { auths: true },
                        }) as Promise<UserWithAuths>;
                    });

                    return done(null, user);
                }
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

export default passport;
