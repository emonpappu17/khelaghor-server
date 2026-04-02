import { addDays, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { SlotStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { minutesToTime, parseDate, timeToMinutes } from "../../utils/parseTime";
import type { CreateSlotsInput, UpdateSlotInput } from "./slot.validation";

const ensureHostField = async (userId: string, fieldId: string) => {
    const field = await prisma.field.findUnique({ where: { id: fieldId } });

    if (!field) {
        throw new AppError("Field not found", 404);
    }

    // Check if user owns the field
    const host = await prisma.host.findUnique({ where: { id: field.hostId } });
    if (!host || host.userId !== userId) {
        throw new AppError("You don't have permission to modify this field", 403);
    }

    if (field.status === "SUSPENDED") {
        throw new AppError("Cannot modify slots for a suspended field", 403);
    }

    return field;
};

const ensureNoOverlapWithinRange = async (
    fieldId: string,
    slotsToCreate: Array<{
        date: Date;
        startTime: string;
        endTime: string;
    }>,
    excludeSlotId?: string
) => {
    if (slotsToCreate.length === 0) return;

    // Get unique dates in yyyy-MM-dd format
    const uniqueDates = [...new Set(slotsToCreate.map((s) => format(s.date, "yyyy-MM-dd")))];

    // Convert back to Date objects for Prisma query
    const parsedDates = uniqueDates.map((d) => parseISO(d));

    // Fetch existing slots for those dates
    const existingSlots = await prisma.slot.findMany({
        where: {
            fieldId,
            date: { in: parsedDates },
            ...(excludeSlotId && { id: { not: excludeSlotId } }),
        },
    });

    // Check overlaps
    for (const candidate of slotsToCreate) {
        const candidateStart = timeToMinutes(candidate.startTime);
        const candidateEnd = timeToMinutes(candidate.endTime);
        const candidateDateStr = format(candidate.date, "yyyy-MM-dd");

        for (const existing of existingSlots) {
            const existingDateStr = format(existing.date, "yyyy-MM-dd");

            // Only compare slots on the same date
            if (existingDateStr !== candidateDateStr) continue;

            const existingStart = timeToMinutes(existing.startTime);
            const existingEnd = timeToMinutes(existing.endTime);

            // Overlap check: [a, b) overlaps [c, d) if a < d && c < b
            if (candidateStart < existingEnd && existingStart < candidateEnd) {
                throw new AppError(
                    `Slot conflicts with existing slot on ${candidateDateStr} from ${existing.startTime} to ${existing.endTime}`,
                    409
                );
            }
        }
    }
};

const createSlots = async (
    userId: string,
    fieldId: string,
    data: CreateSlotsInput
) => {
    // Verify field ownership and status
    await ensureHostField(userId, fieldId);

    const startDate = parseDate(data.startDate);
    const endDate = parseDate(data.endDate);
    const startTimeMinutes = timeToMinutes(data.startTime);
    const endTimeMinutes = timeToMinutes(data.endTime);

    // Edge case: end time must be after start time
    if (endTimeMinutes <= startTimeMinutes) {
        throw new AppError("End time must be after start time", 400);
    }

    // Edge case: date range must be future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isBefore(startDate, startOfDay(new Date()))) {
        throw new AppError("Start date must be in the future", 400);
    }

    // Edge case: end date must be >= start date
    if (isBefore(endDate, startDate)) {
        throw new AppError("End date must be greater than or equal to start date", 400);
    }

    // Edge case: slot duration must fit in time range
    const duration = data.slotDurationMinutes;
    const totalTimeAvailable = endTimeMinutes - startTimeMinutes;
    if (duration > totalTimeAvailable) {
        throw new AppError(
            `Slot duration (${duration}min) exceeds available time range (${totalTimeAvailable}min)`,
            400
        );
    }

    // Edge case: generate no slots if time range is too small
    if (totalTimeAvailable < duration) {
        throw new AppError(
            `No slots can fit in the time range with ${duration}min duration`,
            400
        );
    }

    // Generate all slots
    const slotsToCreate: Array<{
        date: Date;
        startTime: string;
        endTime: string;
        pricePerSlot: number;
    }> = [];

    // Iterate through each date
    for (
        let currentDate = startDate; !isAfter(currentDate, endDate); currentDate = addDays(currentDate, 1)
    ) {
        // Iterate through each time slot on this date
        for (let slotStart = startTimeMinutes; slotStart + duration <= endTimeMinutes; slotStart += duration) {
            const slotEnd = slotStart + duration;

            slotsToCreate.push({
                date: new Date(currentDate), // Create new date object to avoid reference issues
                startTime: minutesToTime(slotStart),
                endTime: minutesToTime(slotEnd),
                pricePerSlot: data.pricePerSlot,
            });
        }
    }

    if (slotsToCreate.length === 0) {
        throw new AppError("No slots could be generated with the provided parameters", 400);
    }

    // Use Serializable transaction to prevent race conditions
    return await prisma.$transaction(
        async (tx) => {
            // Check for overlaps
            await ensureNoOverlapWithinRange(fieldId, slotsToCreate);

            try {
                // Create slots
                const result = await tx.slot.createMany({
                    data: slotsToCreate.map((slot) => ({
                        fieldId,
                        date: slot.date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        pricePerSlot: slot.pricePerSlot,
                    })),
                    skipDuplicates: false,
                });

                return {
                    success: true,
                    message: `${result.count} slots created successfully`,
                    count: result.count,
                    totalGenerated: slotsToCreate.length,
                };
            } catch (error: any) {
                // Edge case: Handle unique constraint violation
                if (error?.code === "P2002") {
                    throw new AppError(
                        "One or more slots already exist at these times. Please check and try again.",
                        409
                    );
                }
                throw error;
            }
        },
        { isolationLevel: "Serializable" }
    );
};

const getSlots = async (fieldId: string, query?: { status?: string }) => {
    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field) {
        throw new AppError("Field not found", 404);
    }

    const where: any = { fieldId };
    if (query?.status) {
        const validStatuses = Object.values(SlotStatus);
        if (validStatuses.includes(query.status as SlotStatus)) {
            where.status = query.status as SlotStatus;
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
    // Verify field ownership
    await ensureHostField(userId, fieldId);

    // Get existing slot
    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) {
        throw new AppError("Slot not found", 404);
    }

    // Edge case: slot must belong to this field
    if (slot.fieldId !== fieldId) {
        throw new AppError("Slot does not belong to this field", 400);
    }

    // Edge case: prevent certain status transitions
    // (e.g., you might not want to unbook a slot unless admin)
    const updatePayload: any = {};

    if (data.pricePerSlot !== undefined) {
        updatePayload.pricePerSlot = data.pricePerSlot;
    }

    if (data.status !== undefined) {
        // Optional: add business rule - prevent changing status of booked slots
        if (slot.status === SlotStatus.BOOKED && data.status !== SlotStatus.BOOKED) {
            throw new AppError("Cannot change status of a booked slot", 403);
        }
        updatePayload.status = data.status;
    }

    if (Object.keys(updatePayload).length === 0) {
        throw new AppError("At least one field (price or status) must be provided", 400);
    }

    const updated = await prisma.slot.update({
        where: { id: slotId },
        data: updatePayload,
    });

    return updated;
};

const deleteSlot = async (userId: string, fieldId: string, slotId: string) => {

    await ensureHostField(userId, fieldId);

    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) {
        throw new AppError("Slot not found", 404);
    }

    if (slot.fieldId !== fieldId) {
        throw new AppError("Slot does not belong to this field", 400);
    }

    if (slot.status === SlotStatus.BOOKED) {
        throw new AppError("Cannot delete a booked slot", 403);
    }

    await prisma.slot.delete({ where: { id: slotId } });

    return {
        success: true,
        message: "Slot deleted successfully",
    };
};

export const SlotService = {
    createSlots,
    getSlots,
    updateSlot,
    deleteSlot,
};
