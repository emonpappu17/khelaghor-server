import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';
import { ChangePasswordInput, LoginInput, RegisterInput } from './auth.validation';
import { setAuthCookie } from '../../utils/setCookie';
import { env } from '../../config/env';

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

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    console.log('user==>', user);
    const result = await AuthService.changePassword(user, req?.body as ChangePasswordInput);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Password changed successfully',
        data: result
    });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
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

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Logged out successfully',
    });
});


export const AuthController = { register, login, logout, changePassword };
