import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { UserRole } from "../../../generated/prisma/enums";
import type { ApplyHostInput, UpdateHostInput } from "./host.validation";

const applyHost = async (userId: string, data: ApplyHostInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isDeleted) {
    throw new AppError("This account has been deleted", 403);
  }

  const existingHost = await prisma.host.findUnique({ where: { userId } });

  if (existingHost) {
    // If user already has a host profile, just update it
    return prisma.host.update({
      where: { id: existingHost.id },
      data: {
        businessName: data.business_name,
        nidNumber: data.nid_number,
      },
    });
  }

  // Promote user to HOST role if not already
  if (user.role !== UserRole.HOST) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.HOST },
    });
  }

  return prisma.host.create({
    data: {
      userId,
      businessName: data.business_name,
      nidNumber: data.nid_number,
    },
  });
};

const getHostByUserId = async (userId: string) => {
  const host = await prisma.host.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!host) {
    throw new AppError("Host profile not found", 404);
  }

  return host;
};

const updateHost = async (userId: string, data: UpdateHostInput) => {
  const host = await prisma.host.findUnique({ where: { userId } });
  if (!host) {
    throw new AppError("Host profile not found", 404);
  }

  const updated = await prisma.host.update({
    where: { id: host.id },
    data: {
      businessName: data.business_name,
      nidNumber: data.nid_number,
    },
  });

  return updated;
};

const listHosts = async (options: { page?: number; limit?: number; isApproved?: boolean }) => {
  const page = options.page && options.page > 0 ? options.page : 1;
  const limit = options.limit && options.limit > 0 ? options.limit : 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (typeof options.isApproved === "boolean") {
    where.isApproved = options.isApproved;
  }

  const [total, hosts] = await prisma.$transaction([
    prisma.host.count({ where }),
    prisma.host.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return { hosts, total };
};

const getHostById = async (id: string) => {
  const host = await prisma.host.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!host) {
    throw new AppError("Host profile not found", 404);
  }

  return host;
};

const approveHost = async (id: string) => {
  const host = await prisma.host.findUnique({ where: { id } });
  if (!host) {
    throw new AppError("Host profile not found", 404);
  }

  const updated = await prisma.host.update({
    where: { id },
    data: { isApproved: true, approvedAt: new Date() },
  });

  return updated;
};

export const HostService = {
  applyHost,
  getHostByUserId,
  updateHost,
  listHosts,
  getHostById,
  approveHost,
};
