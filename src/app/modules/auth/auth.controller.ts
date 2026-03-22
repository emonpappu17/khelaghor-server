import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';
import { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput, VerifyOptInput } from './auth.validation';
import { setAuthCookie } from '../../utils/setCookie';
import { env } from '../../config/env';
import { generateAccessToken, generateRefreshToken, TJwtPayload, verifyResetToken } from '../../utils/jwt';
import { AppError } from '../../errors/AppError';
import { UserWithAuths } from '../../config/passport';
import { parseTimeToMs } from '../../utils/parseTime';
import { redisClient } from '../../lib/redis';

const REFRESH_PREFIX = "refresh-token:";

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body as RegisterInput);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Registration successful',
        data: result,
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body as LoginInput);

    setAuthCookie(res, { accessToken: result.accessToken, refreshToken: result.refreshToken })

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Login successful',
        data: {
            accessToken: result.accessToken,
            user: result.user,
        },
    });
});


const getNewAccessToken = catchAsync(async (req: Request, res: Response) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new AppError("Refresh token not found", 401);

    const result = await AuthService.getNewAccessToken(refreshToken as string);

    setAuthCookie(res, { accessToken: result.accessToken, refreshToken: result.newRefreshToken })

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Token refreshed successfully',
        data: result,
    });
})


const changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = req.authUser;
    const result = await AuthService.changePassword(user as TJwtPayload, req?.body as ChangePasswordInput);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Password changed successfully',
        data: result
    });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {

    const result = await AuthService.forgotPassword(req?.body as ForgotPasswordInput);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'OTP sent to your email',
        data: result
    });
});

const verifyForgotPasswordOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.verifyForgotPasswordOtp(req.body as VerifyOptInput);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "OTP verified successfully",
        data: result,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const resetToken = req?.headers.authorization;
    req.authUser = verifyResetToken(resetToken as string) as TJwtPayload;

    const result = await AuthService.resetPassword(req.body as ResetPasswordInput, (req.authUser as TJwtPayload).userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Password reset successfully",
        data: result,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    });

    // 🔄 Invalidate refresh token in Redis
    if (req.authUser) {
        await redisClient.del(`${REFRESH_PREFIX}${(req.authUser as TJwtPayload).userId}`);
    }

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Logged out successfully',
    });
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
    let redirectTo = req.query.state ? req.query.state as string : "";

    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1);
    }

    if (!req.user) {
        return res.redirect(`${env.CLIENT_URL}/login?error=GoogleAuthFailed`);
    }

    const user = req.user as UserWithAuths;

    // Generate tokens
    const tokenPayload: TJwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshMaxAge = parseTimeToMs(env.JWT_REFRESH_EXPIRES_IN);

    // 🔄 Store refresh token for rotation
    await redisClient.set(`${REFRESH_PREFIX}${user.id}`, refreshToken, {
        expiration: { type: "EX", value: refreshMaxAge },
    });

    setAuthCookie(res, { accessToken, refreshToken })

    res.redirect(`${env.CLIENT_URL}/${redirectTo}`)
});

export const AuthController = {
    register,
    login,
    logout,
    changePassword,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    googleCallback,
    getNewAccessToken
};
