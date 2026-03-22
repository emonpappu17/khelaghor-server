import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../../generated/prisma/enums";
import type { UpdateProfileInput, UpdateRoleInput, UpdateStatusInput } from "./user.validation";
import { TPaginationOptions } from "../../types/pagination";
import { calculatePagination } from "../../utils/calculatePagination";
import { deleteImage, extractPublicId, uploadSingleImage } from "../../config/cloudinary";

const getProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            status: true,
            isVerified: true,
            // isDeleted: true,
            createdAt: true,
            updatedAt: true,
            hostProfile: {
                select: {
                    id: true,
                    businessName: true,
                    nidNumber: true,
                    isApproved: true,
                    approvedAt: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return user;
};

const updateProfile = async (
    userId: string,
    data: UpdateProfileInput,
    file?: Express.Multer.File
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, avatar: true },
    });

    if (!user) throw new AppError("User not found", 404);

    let avatarUrl = user.avatar;
    let newPublicId: string | null = null;

    // Upload new avatar if provided
    if (file) {
        const { secure_url, public_id } = await uploadSingleImage(file);
        avatarUrl = secure_url;
        newPublicId = public_id;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            phone: data.phone,
            avatar: avatarUrl,
        },
    });

    // Delete old avatar if replaced
    if (file && user.avatar) {
        const oldPublicId = extractPublicId(user.avatar);
        if (oldPublicId && oldPublicId !== newPublicId) {
            await deleteImage(oldPublicId).catch(err =>
                console.error("Failed to delete old avatar:", err)
            );
        }
    }

    return updatedUser;
};


const deleteAccount = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.isDeleted) {
        throw new AppError("User account already deleted", 400);
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true },
    });

    return { message: "Account deleted successfully" };
};

const getUsers = async (
    filters: { role?: string; status?: string },
    options: TPaginationOptions
) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    const where: any = { isDeleted: false };

    if (filters.role) {
        where.role = filters.role;
    }

    if (filters.status) {
        where.status = filters.status;
    }

    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
                status: true,
                isVerified: true,
                createdAt: true,
            },
        }),
    ]);

    return { users, total, page, limit };
};

const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            status: true,
            isVerified: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            hostProfile: {
                select: {
                    id: true,
                    businessName: true,
                    nidNumber: true,
                    isApproved: true,
                    approvedAt: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return user;
};

const updateUserStatus = async (userId: string, data: UpdateStatusInput) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            status: data.status,
        },
    });

    return updated;
};

const updateUserRole = async (userId: string, data: UpdateRoleInput) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    let hostProfile = await prisma.host.findUnique({ where: { userId } });

    if (data.role === UserRole.HOST && !hostProfile) {
        hostProfile = await prisma.host.create({
            data: { userId, businessName: null, nidNumber: null },
        });
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            role: data.role as UserRole,
        },
    });

    return { user: updated, hostProfile };
};

const deleteUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.isDeleted) {
        throw new AppError("User account already deleted", 400);
    }

    await prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true },
    });

    return { message: "User deleted successfully" };
};

export const UserService = {
    getProfile,
    updateProfile,
    deleteAccount,
    getUsers,
    getUserById,
    updateUserStatus,
    updateUserRole,
    deleteUser,
};
