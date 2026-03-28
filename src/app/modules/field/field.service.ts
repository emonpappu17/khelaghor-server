import { SportType } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { TPaginationOptions } from "../../types/pagination";
import { calculatePagination } from "../../utils/calculatePagination";
import type { CreateFieldInput, UpdateFieldInput } from "./field.validation";

const getHostByUserId = async (userId: string) => {
  const host = await prisma.host.findUnique({ where: { userId } });
  if (!host) throw new AppError("Host profile not found", 404);
  if (!host.isApproved) throw new AppError("Host not approved", 403);

  return host;
};

const createField = async (userId: string, data: CreateFieldInput) => {
  const host = await getHostByUserId(userId);

  const field = await prisma.field.create({
    data: {
      hostId: host.id,
      name: data.name,
      sportType: data.sportType as SportType,
      description: data.description,
      maxPlayers: data.maxPlayers ?? 10,
      facilities: data.facilities ?? [],
      images: data.images ?? [],
      division: data.division,
      district: data.district,
      address: data.address,
      area: data.area,
      latitude: data.latitude,
      longitude: data.longitude,
      status: "ACTIVE",
    },
  });

  return field;
};

const ensureHostField = async (userId: string, fieldId: string) => {
  const field = await prisma.field.findUnique({ where: { id: fieldId } });

  if (!field) throw new AppError("Field not found", 404);

  if (field.hostId !== userId) {
    const host = await prisma.host.findUnique({ where: { id: field.hostId } });
    if (!host || host.userId !== userId) {
      throw new AppError("Forbidden: not your field", 403);
    }
  }

  return field;
};

const updateField = async (userId: string, fieldId: string, data: UpdateFieldInput) => {
  const field = await ensureHostField(userId, fieldId);

  if (field.status === "SUSPENDED") {
    throw new AppError("Cannot modify a suspended field", 403);
  }

  const updated = await prisma.field.update({
    where: { id: fieldId },
    data: {
      ...data,
      sportType: data.sportType as SportType,
      maxPlayers: data.maxPlayers ?? field.maxPlayers,
      facilities: data.facilities ?? field.facilities,
      images: data.images ?? field.images,
    },
  });

  return updated;
};

const getFields = async (
  filters: {
    sportType?: string;
    division?: string;
    district?: string;
    area?: string;
    status?: string;
  },
  options: TPaginationOptions
) => {
  // const page = Number(options.page ?? 1);
  // const limit = Number(options.limit ?? 20);
  // const skip = (page - 1) * limit;
  // const sortBy = options.sortBy ?? "createdAt";
  // const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);


  const where: any = {};

  if (filters.sportType) where.sportType = filters.sportType;
  if (filters.division) where.division = filters.division;
  if (filters.district) where.district = filters.district;
  if (filters.area) where.area = filters.area;
  if (filters.status) where.status = filters.status;

  const [total, fields] = await prisma.$transaction([
    prisma.field.count({ where }),
    prisma.field.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { slots: true },
    }),
  ]);

  return { total, page, limit, fields };
};

const getFieldById = async (fieldId: string) => {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
    include: { slots: true, host: true },
  });

  if (!field) {
    throw new AppError("Field not found", 404);
  }

  return field;
};

const deleteField = async (userId: string, fieldId: string) => {
  const field = await ensureHostField(userId, fieldId);

  if (field.status === "INACTIVE") {
    throw new AppError("Field already inactive", 400);
  }

  const updated = await prisma.field.update({
    where: { id: fieldId },
    data: { status: "INACTIVE" },
  });

  return updated;
};

export const FieldService = {
  createField,
  updateField,
  getFields,
  getFieldById,
  deleteField,
};
