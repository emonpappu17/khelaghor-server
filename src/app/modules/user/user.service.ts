import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../../generated/prisma/enums";
import type { UpdateProfileInput, UpdateRoleInput, UpdateStatusInput } from "./user.validation";

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

// const updateProfile = async (userId: string, data: UpdateProfileInput) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true },
//   });

//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   const updated = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       name: data.name,
//       phone: data.phone,
//       avatar: data.avatar,
//     },
//   });

//   return updated;
// };

// const deleteAccount = async (userId: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, isDeleted: true },
//   });

//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   if (user.isDeleted) {
//     throw new AppError("User account already deleted", 400);
//   }

//   await prisma.user.update({
//     where: { id: userId },
//     data: { isDeleted: true },
//   });

//   return { message: "Account deleted successfully" };
// };

// const getUsers = async (options: {
//   page?: number;
//   limit?: number;
//   role?: string;
//   status?: string;
// }) => {
//   const page = options.page && options.page > 0 ? options.page : 1;
//   const limit = options.limit && options.limit > 0 ? options.limit : 20;
//   const skip = (page - 1) * limit;

//   const where: any = {
//     isDeleted: false,
//   };

//   if (options.role) {
//     where.role = options.role;
//   }

//   if (options.status) {
//     where.status = options.status;
//   }

//   const [total, users] = await prisma.$transaction([
//     prisma.user.count({ where }),
//     prisma.user.findMany({
//       where,
//       skip,
//       take: limit,
//       orderBy: { createdAt: "desc" },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         phone: true,
//         avatar: true,
//         role: true,
//         status: true,
//         isVerified: true,
//         createdAt: true,
//       },
//     }),
//   ]);

//   return { users, total };
// };

// const getUserById = async (id: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       phone: true,
//       avatar: true,
//       role: true,
//       status: true,
//       isVerified: true,
//       isDeleted: true,
//       createdAt: true,
//       updatedAt: true,
//       hostProfile: {
//         select: {
//           id: true,
//           businessName: true,
//           nidNumber: true,
//           isApproved: true,
//           approvedAt: true,
//           createdAt: true,
//         },
//       },
//     },
//   });

//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   return user;
// };

// const updateUserStatus = async (userId: string, data: UpdateStatusInput) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   const updated = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       status: data.status,
//     },
//   });

//   return updated;
// };

// const updateUserRole = async (userId: string, data: UpdateRoleInput) => {
//   const user = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   // If promoting to HOST, ensure a host profile exists
//   let hostProfile = await prisma.host.findUnique({ where: { userId } });

//   if (data.role === UserRole.HOST && !hostProfile) {
//     hostProfile = await prisma.host.create({
//       data: { userId, businessName: null, nidNumber: null },
//     });
//   }

//   const updated = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       role: data.role as UserRole,
//     },
//   });

//   return { user: updated, hostProfile };
// };

// const deleteUser = async (userId: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, isDeleted: true },
//   });

//   if (!user) {
//     throw new AppError("User not found", 404);
//   }

//   if (user.isDeleted) {
//     throw new AppError("User account already deleted", 400);
//   }

//   await prisma.user.update({
//     where: { id: userId },
//     data: { isDeleted: true },
//   });

//   return { message: "User deleted successfully" };
// };

export const UserService = {
    getProfile,
    //   updateProfile,
    //   deleteAccount,
    //   getUsers,
    //   getUserById,
    //   updateUserStatus,
    //   updateUserRole,
    //   deleteUser,
};
