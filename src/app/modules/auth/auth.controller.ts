import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';
import { RegisterInput } from './auth.validation';

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body as RegisterInput);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Registration successful',
        data: result,
    });
});


export const AuthController = { register };
