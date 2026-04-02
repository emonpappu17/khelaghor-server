import { z } from "zod";
import { SlotStatus } from "../../../generated/prisma/enums";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const timeSchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

// Helper to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Validation for creating multiple slots with date/time range
const createSlotsSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    slotDurationMinutes: z
      .number()
      .int()
      .min(15, "Slot duration must be at least 15 minutes")
      .max(480, "Slot duration can be max 480 minutes (8 hours)")
      .default(60),
    pricePerSlot: z.number().positive("Price per slot must be a positive number"),
  })
  .refine(
    (data) => {
      const [sYear, sMonth, sDate] = data.startDate.split("-").map(Number);
      const [eYear, eMonth, eDate] = data.endDate.split("-").map(Number);
      const startDate = new Date(sYear, sMonth - 1, sDate);
      const endDate = new Date(eYear, eMonth - 1, eDate);
      return endDate >= startDate;
    },
    { message: "End date must be greater than or equal to start date", path: ["endDate"] }
  )
  .refine(
    (data) => {
      const startTime = timeToMinutes(data.startTime);
      const endTime = timeToMinutes(data.endTime);
      return endTime > startTime;
    },
    { message: "End time must be after start time", path: ["endTime"] }
  );

// Validation for updating individual slot (only price and status)
const updateSlotSchema = z
  .object({
    pricePerSlot: z.number().positive("Price per slot must be a positive number").optional(),
    status: z.enum(SlotStatus).optional(),
  })
  .refine(
    (data) => data.pricePerSlot !== undefined || data.status !== undefined,
    { message: "At least one of pricePerSlot or status must be provided" }
  );

export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;

export const SlotValidation = {
  createSlotsSchema,
  updateSlotSchema,
  timeToMinutes,
};
