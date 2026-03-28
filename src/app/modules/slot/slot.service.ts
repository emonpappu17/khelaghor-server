import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { SlotStatus } from "../../../generated/prisma/enums";
import type {
    CreateSlotInput,
    BulkCreateSlotsInput,
    UpdateSlotInput,
    SlotQueryInput,
} from "./slot.validation";

const parseDate = (value: string): Date => {
    const normalized = value.trim();
    let date: Date;

    if (normalized.includes("/")) {
        const [month, day, year] = normalized.split("/").map((part) => Number(part));

        if (
            Number.isNaN(month) ||
            Number.isNaN(day) ||
            Number.isNaN(year) ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            throw new AppError(`Invalid date format: ${value}`, 400);
        }

        date = new Date(year, month - 1, day);

        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            throw new AppError(`Invalid date value: ${value}`, 400);
        }
    } else {
        date = new Date(normalized);
        if (Number.isNaN(date.getTime())) {
            throw new AppError(`Invalid date format: ${value}`, 400);
        }
    }

    date.setHours(0, 0, 0, 0);
    return date;
};

const formatDateKey = (date: Date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const parseTime = (value: string): number => {
    const parts = value.trim().split(":");
    if (parts.length !== 2) throw new AppError(`Invalid time format: ${value}`, 400);

    const [hh, mm] = parts.map((i) => Number(i));

    if (
        Number.isNaN(hh) ||
        Number.isNaN(mm) ||
        hh < 0 ||
        hh > 23 ||
        mm < 0 ||
        mm > 59
    ) {
        throw new AppError(`Invalid time value: ${value}`, 400);
    }

    return hh * 60 + mm;
};

const formatTime = (minutes: number): string => {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const validateAndNormalizeSlot = (input: CreateSlotInput) => {
    const date = parseDate(input.date);
    const start = parseTime(input.startTime);
    const end = parseTime(input.endTime);

    if (end <= start) {
        throw new AppError("Slot endTime must be later than startTime", 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getTime() < today.getTime()) {
        throw new AppError("Slot date must be in the future", 400);
    }

    return {
        date: formatDateKey(date),
        startTime: formatTime(start),
        endTime: formatTime(end),
        pricePerSlot: input.pricePerSlot,
    };
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

    if (field.status === "SUSPENDED") {
        throw new AppError("Cannot modify slots for a suspended field", 403);
    }

    return field;
};

const ensureNoOverlap = async (
    fieldId: string,
    slotsData: Array<{ date: string; startTime: string; endTime: string }>,
    tx = prisma,
    excludeSlotId?: string
) => {
    if (!slotsData.length) return;

    const dates = [...new Set(slotsData.map((s) => s.date))];

    const existingSlots = await tx.slot.findMany({
        where: {
            fieldId,
            date: { in: dates },
            ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
        },
    });

    for (const candidate of slotsData) {
        const candidateStart = parseTime(candidate.startTime);
        const candidateEnd = parseTime(candidate.endTime);

        for (const existing of existingSlots) {
            if (existing.date.toISOString().slice(0, 10) !== candidate.date) continue;
            const existingStart = parseTime(existing.startTime);
            const existingEnd = parseTime(existing.endTime);

            if (candidateStart < existingEnd && existingStart < candidateEnd) {
                throw new AppError("One or more slots overlap with existing slots", 409);
            }
        }
    }
};

const createSlot = async (userId: string, fieldId: string, data: CreateSlotInput) => {
    const field = await ensureHostField(userId, fieldId);
    const slot = validateAndNormalizeSlot(data);

    return await prisma.$transaction(
        async (tx) => {
            await ensureNoOverlap(field.id, [slot], tx);

            try {
                const created = await tx.slot.create({
                    data: {
                        fieldId: field.id,
                        date: new Date(slot.date),
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        pricePerSlot: slot.pricePerSlot,
                    },
                });

                return created;
            } catch (error: any) {
                if (error?.code === "P2002") {
                    throw new AppError("Slot already exists for this date and start time", 409);
                }
                throw error;
            }
        },
        { isolationLevel: "Serializable" }
    );
};

const bulkCreateSlots = async (userId: string, fieldId: string, data: BulkCreateSlotsInput) => {
    const field = await ensureHostField(userId, fieldId);

    const minDate = parseDate(data.dateFrom);
    const maxDate = parseDate(data.dateTo);

    if (maxDate.getTime() < minDate.getTime()) {
        throw new AppError("dateTo must be equal or later than dateFrom", 400);
    }

    if (minDate.getTime() < new Date(new Date().setHours(0, 0, 0, 0)).getTime()) {
        throw new AppError("Date range must start in the future", 400);
    }

    let slotsToCreate: Array<{ date: string; startTime: string; endTime: string; pricePerSlot: number }> = [];

    if (data.customSlots && data.customSlots.length > 0) {
        slotsToCreate = data.customSlots.map((slot) => ({
            ...validateAndNormalizeSlot(slot),
            pricePerSlot: slot.pricePerSlot,
        }));
    } else {
        const dayCount = Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const slotDuration = data.slotDurationMinutes;
        const rawStart = parseTime(data.startTime);
        const rawEnd = parseTime(data.endTime);

        if (rawEnd <= rawStart) {
            throw new AppError("endTime must be later than startTime", 400);
        }

        for (let day = 0; day <= dayCount; day++) {
            const current = new Date(minDate.getTime() + day * 24 * 60 * 60 * 1000);
            const dateKey = formatDateKey(current);

            for (let t = rawStart; t + slotDuration <= rawEnd; t += slotDuration) {
                slotsToCreate.push({
                    date: dateKey,
                    startTime: formatTime(t),
                    endTime: formatTime(t + slotDuration),
                    pricePerSlot: data.pricePerSlot,
                });
            }
        }
    }

    if (!slotsToCreate.length) {
        throw new AppError("No slots generated. Check the time range and duration.", 400);
    }

    return await prisma.$transaction(
        async (tx) => {
            await ensureNoOverlap(field.id, slotsToCreate, tx);

            try {
                const created = await tx.slot.createMany({
                    data: slotsToCreate.map((slot) => ({
                        fieldId: field.id,
                        date: new Date(slot.date),
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        pricePerSlot: slot.pricePerSlot,
                    })),
                    skipDuplicates: false,
                });

                return { created: created.count, slots: slotsToCreate.length };
            } catch (error: any) {
                if (error?.code === "P2002") {
                    throw new AppError("One or more slots already exist (unique constraint).", 409);
                }
                throw error;
            }
        },
        { isolationLevel: "Serializable" }
    );
};

const getSlots = async (fieldId: string, query: SlotQueryInput) => {
    const where: any = { fieldId };

    if (query.status) where.status = query.status;

    if (query.dateFrom || query.dateTo) {
        where.date = {};

        if (query.dateFrom) {
            where.date.gte = parseDate(query.dateFrom);
        }
        if (query.dateTo) {
            where.date.lte = parseDate(query.dateTo);
        }
    }

    const slots = await prisma.slot.findMany({
        where,
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return slots;
};

const updateSlot = async (
    userId: string,
    fieldId: string,
    slotId: string,
    data: UpdateSlotInput
) => {
    await ensureHostField(userId, fieldId);

    const existingSlot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!existingSlot) throw new AppError("Slot not found", 404);
    if (existingSlot.fieldId !== fieldId) throw new AppError("Slot does not belong to the field", 400);

    const updateData: any = {};

    if (data.date) {
        updateData.date = new Date(formatDateKey(parseDate(data.date)));
    }
    if (data.startTime) {
        updateData.startTime = formatTime(parseTime(data.startTime));
    }
    if (data.endTime) {
        updateData.endTime = formatTime(parseTime(data.endTime));
    }

    if (updateData.startTime || updateData.endTime) {
        const startTime = updateData.startTime ?? existingSlot.startTime;
        const endTime = updateData.endTime ?? existingSlot.endTime;

        if (parseTime(startTime) >= parseTime(endTime)) {
            throw new AppError("Updated time window is invalid", 400);
        }

        const candidateDate = updateData.date ? formatDateKey(updateData.date) : existingSlot.date.toISOString().slice(0, 10);

        await ensureNoOverlap(
            fieldId,
            [
                {
                    date: candidateDate,
                    startTime,
                    endTime,
                },
            ],
            prisma,
            slotId
        );
    }

    if (data.pricePerSlot !== undefined) {
        updateData.pricePerSlot = data.pricePerSlot;
    }
    if (data.status !== undefined) {
        updateData.status = data.status;
    }

    const updated = await prisma.slot.update({ where: { id: slotId }, data: updateData });

    return updated;
};

const deleteSlot = async (userId: string, fieldId: string, slotId: string) => {
    await ensureHostField(userId, fieldId);

    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) throw new AppError("Slot not found", 404);
    if (slot.fieldId !== fieldId) throw new AppError("Slot does not belong to this field", 400);

    await prisma.slot.delete({ where: { id: slotId } });

    return { message: "Slot deleted successfully" };
};

export const SlotService = {
    createSlot,
    bulkCreateSlots,
    getSlots,
    updateSlot,
    deleteSlot,
};
