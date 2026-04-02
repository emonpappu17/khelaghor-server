import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SlotService } from "./slot.service";
import type { CreateSlotsInput, UpdateSlotInput } from "./slot.validation";

const createSlots = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId as string;
  const payload = req.body as CreateSlotsInput;

  const result = await SlotService.createSlots(userId, fieldId, payload);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result.message,
    data: result,
  });
});

const getSlots = catchAsync(async (req: Request, res: Response) => {
  const fieldId = req.params.fieldId as string;
  const query = req.query as { status?: string };

  const slots = await SlotService.getSlots(fieldId, query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: slots.length === 0 ? "No slots found" : "Slots fetched successfully",
    data: slots,
  });
});

const updateSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId as string;
  const slotId = req.params.slotId as string;
  const payload = req.body as UpdateSlotInput;

  const updated = await SlotService.updateSlot(userId, fieldId, slotId, payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Slot updated successfully",
    data: updated,
  });
});

const deleteSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId as string;
  const slotId = req.params.slotId as string;

  const result = await SlotService.deleteSlot(userId, fieldId, slotId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

export const SlotController = {
  createSlots,
  getSlots,
  updateSlot,
  deleteSlot,
};
