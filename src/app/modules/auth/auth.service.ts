import bcrypt from 'bcrypt';
import { AuthProvider, UserRole } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { generateOtpEmailHTML } from "../../utils/emailHTMLtext";
import { generateOTP } from "../../utils/generateOTP";
import { generateAccessToken, generateRefreshToken, TJwtPayload } from "../../utils/jwt";
import { sendEmail } from "../../utils/sendEmail";
import { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, VerifyOptInput } from "./auth.validation";

const OTP_PREFIX = "forgot-password-otp:";
const OTP_EXPIRATION = 2 * 60 //2 minute

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
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new AppError("User with this email does not exist", 404);
    }

    const otp = generateOTP();

    await redisClient.set(`${OTP_PREFIX}${user.email}`, otp, {
        expiration: {
            type: "EX",
            value: OTP_EXPIRATION
        }
    });

    const emailHtml = generateOtpEmailHTML(otp);

    await sendEmail(
        user.email,
        emailHtml,
        "Your Password Reset OTP",
    );

    return { message: "OTP sent to your email" };
}

const verifyForgotPasswordOtp = async (data: VerifyOptInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (!user) {
        throw new AppError("User with this email does not exist", 404);
    }

    const storedOtp = await redisClient.get(`${OTP_PREFIX}${user.email}`);

    if (!storedOtp) {
        throw new AppError("OTP expired or not found", 400);
    }

    if (storedOtp !== data.otp.toString()) {
        throw new AppError("Invalid OTP", 400);
    }

    await redisClient.del(`${OTP_PREFIX}${user.email}`);

    return { message: "OTP verified successfully. You may now reset your password." };
};


export const AuthService = { register, login, changePassword, forgotPassword, verifyForgotPasswordOtp };
