import { Prisma } from "../../../generated/prisma/client";
import { UserRole, UserStatus } from "../../../generated/prisma/enums";
import { deleteImage, extractPublicId, uploadSingleImage } from "../../config/cloudinary";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { calculatePagination } from "../../utils/calculatePagination";
import type { UpdateProfileInput, UpdateRoleInput, UpdateStatusInput } from "./user.validation";

type TUserFilters = {
    search?: string;
    role?: string;
    status?: string;
    isVerified?: string;
    isDeleted?: string;
    isApproved?: string;
};

// Whitelist prevents orderBy injection
const ALLOWED_SORT_FIELDS: (keyof Prisma.UserOrderByWithRelationInput)[] = [
    "createdAt",
    "updatedAt",
    "name",
    "email",
    "role",
    "status",
];

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

// const getUsers = async (
//     filters: { role?: string; status?: string },
//     options: TPaginationOptions
// ) => {
//     const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

//     const where: any = { isDeleted: false };

//     if (filters.role) {
//         where.role = filters.role;
//     }

//     if (filters.status) {
//         where.status = filters.status;
//     }

//     const [total, users] = await prisma.$transaction([
//         prisma.user.count({ where }),
//         prisma.user.findMany({
//             where,
//             skip,
//             take: limit,
//             orderBy: { [sortBy]: sortOrder },
//             select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//                 avatar: true,
//                 role: true,
//                 status: true,
//                 isVerified: true,
//                 createdAt: true,
//             },
//         }),
//     ]);

//     return { users, total, page, limit };
// };


const getUsers = async (filters: TUserFilters, options: TPaginationOptions) => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

    // Guard against arbitrary field injection
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(
        sortBy as keyof Prisma.UserOrderByWithRelationInput
    )
        ? sortBy
        : "createdAt";

    // ── Build WHERE ────────────────────────────────────────────────────────────

    const where: Prisma.UserWhereInput = {
        // Admins see active records by default.
        // Pass isDeleted=true explicitly to inspect soft-deleted users.
        isDeleted: filters.isDeleted === "true" ? true : false,
    };

    // Role — validate against enum to avoid bad DB queries
    if (filters.role) {
        if (!Object.values(UserRole).includes(filters.role as UserRole)) {
            throw new AppError(`Invalid role: ${filters.role}`, 404);
        }
        where.role = filters.role as UserRole;
    }

    // Status — same enum guard
    if (filters.status) {
        if (!Object.values(UserStatus).includes(filters.status as UserStatus)) {
            throw new AppError(`Invalid status: ${filters.status}`, 404);
        }
        where.status = filters.status as UserStatus;
    }

    // isVerified — string "true"/"false" → boolean
    if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified === "true";
    }

    // Full-text search across name, email, phone
    // phone can be null in DB — Prisma handles null columns safely with contains
    if (filters.search?.trim()) {
        where.OR = [
            { name: { contains: filters.search.trim(), mode: "insensitive" } },
            { email: { contains: filters.search.trim(), mode: "insensitive" } },
            { phone: { contains: filters.search.trim(), mode: "insensitive" } },
        ];
    }

    // isApproved — only meaningful for HOST users, but doesn't break other roles
    // (non-HOST users have no hostProfile row → the filter simply returns no match
    //  when isApproved=true, which is correct behaviour)
    if (filters.isApproved !== undefined) {
        where.hostProfile = {
            isApproved: filters.isApproved === "true",
        };
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [safeSortBy]: sortOrder },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                role: true,
                status: true,
                isVerified: true,
                isDeleted: true,  // expose so admin UI can flag deleted rows
                createdAt: true,
                updatedAt: true,
                // Inline host summary — no extra round-trip needed on the admin table
                hostProfile: {
                    select: {
                        id: true,
                        businessName: true,
                        nidNumber: true,
                        isApproved: true,
                        approvedAt: true,
                    },
                },
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
