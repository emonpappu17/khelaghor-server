import { AuthProvider, UserRole } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import bcrypt from 'bcrypt';
import { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput } from "./auth.validation";
import { generateAccessToken, generateRefreshToken, TJwtPayload } from "../../utils/jwt";
import { randomBytes } from "crypto";

const OTP_PREFIX = "forgot-password-otp:";

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

const login = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            avatar: true,
            status: true,
            isDeleted: true,
        },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    if (user.isDeleted) {
        throw new AppError("This account has been deleted", 403);
    }

    if (user.status !== "ACTIVE") {
        throw new AppError("Your account is not active", 403);
    }

    // Check auth provider (credentials login allowed)
    const authProvider = await prisma.auth.findFirst({
        where: {
            userId: user.id,
            provider: "credentials",
        },
    });

    if (!authProvider) {
        throw new AppError(
            "This account was registered using social login. Please login with Google.",
            400
        );
    }

    if (!user.password) {
        throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const tokenPayload: TJwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
    };
};

const changePassword = async (user: TJwtPayload, data: ChangePasswordInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: user.userId },
    });

    if (!existingUser) {
        throw new AppError("User not found", 404);
    }

    const isMatch = await bcrypt.compare(data.oldPassword, existingUser.password);
    if (!isMatch) {
        throw new AppError("Old password is incorrect", 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
        where: { id: user.userId },
        data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
}

const forgotPassword = async (data: ForgotPasswordInput) => {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new AppError("User with this email does not exist", 404);
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Store OTP in Redis with TTL (e.g., 5 minutes)
    await redis.set(`${OTP_PREFIX}${user.email}`, otp, { EX: 60 * 5 });

    // 4. Send OTP via email
    await sendEmail({
        to: user.email,
        subject: "Your Password Reset OTP",
        html: `
      <h2>Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `,
    });

    return { message: "OTP sent to your email" };
}


export const AuthService = { register, login, changePassword, forgotPassword };
