import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";
import type { UpdateProfileInput, UpdateRoleInput, UpdateStatusInput } from "./user.validation";
import { TJwtPayload } from "../../utils/jwt";
import pick from "../../utils/pick";

const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const user = await UserService.getProfile(userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User profile fetched successfully",
        data: user,
    });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.authUser as TJwtPayload).userId;
    const payload = req.body as UpdateProfileInput;
    const file = req.file as Express.Multer.File | undefined;
    const user = await UserService.updateProfile(userId, payload, file);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Profile updated successfully",
        data: user,
    });
});

const deleteMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const result = await UserService.deleteAccount(userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Account deleted successfully",
        data: result,
    });
});

const listUsers = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ["role", "status"]);
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

    const { users, total, page, limit } = await UserService.getUsers(filters, options);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Users fetched successfully",
        meta: { page, limit, total },
        data: users,
    });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const user = await UserService.getUserById(userId as string);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User fetched successfully",
        data: user,
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const payload = req.body as UpdateStatusInput;
    const user = await UserService.updateUserStatus(userId as string, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User status updated successfully",
        data: user,
    });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const payload = req.body as UpdateRoleInput;
    const result = await UserService.updateUserRole(userId as string, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User role updated successfully",
        data: result,
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const result = await UserService.deleteUser(userId as string);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "User deleted successfully",
        data: result,
    });
});

export const UserController = {
    getMe,
    updateMe,
    deleteMe,
    listUsers,
    getUser,
    updateUserStatus,
    updateUserRole,
    deleteUser,
};
