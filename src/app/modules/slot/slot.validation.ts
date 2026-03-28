import { z } from "zod";
import { SlotStatus } from "../../../generated/prisma/enums";

const dateSchema = z.string().min(1, "Date is required");

const timeSchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

const createSlotSchema = z.object({
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  pricePerSlot: z.number().positive("Price per slot must be a positive number"),
});

const bulkCreateSlotsSchema = z.object({
  dateFrom: dateSchema,
  dateTo: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  slotDurationMinutes: z
    .number()
    .int()
    .min(15, "Slot duration must be at least 15 minutes")
    .max(360, "Slot duration can be max 360 minutes")
    .optional()
    .default(60),
  pricePerSlot: z.number().positive("Price per slot must be a positive number"),
  customSlots: z.array(createSlotSchema).optional(),
});

const updateSlotSchema = z.object({
  date: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  pricePerSlot: z.number().positive("Price per slot must be a positive number").optional(),
  status: z
    .nativeEnum(SlotStatus, {
      errorMap: () => ({ message: "Invalid slot status" }),
    })
    .optional(),
});

const slotQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z
    .nativeEnum(SlotStatus, {
      errorMap: () => ({ message: "Invalid slot status filter" }),
    })
    .optional(),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
export type BulkCreateSlotsInput = z.infer<typeof bulkCreateSlotsSchema>;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;
export type SlotQueryInput = z.infer<typeof slotQuerySchema>;

export const SlotValidation = {
  createSlotSchema,
  bulkCreateSlotsSchema,
  updateSlotSchema,
  slotQuerySchema,
};
