import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SlotService } from "./slot.service";
import type {
  CreateSlotInput,
  BulkCreateSlotsInput,
  UpdateSlotInput,
  SlotQueryInput,
} from "./slot.validation";

const createSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId;
  const payload = req.body as CreateSlotInput;
  const slot = await SlotService.createSlot(userId, fieldId as string, payload);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Slot created successfully",
    data: slot,
  });
});

const bulkCreateSlots = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId;
  const payload = req.body as BulkCreateSlotsInput;
  const result = await SlotService.bulkCreateSlots(userId, fieldId as string, payload);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Bulk slots created successfully",
    data: result,
  });
});

const getSlots = catchAsync(async (req: Request, res: Response) => {
  const fieldId = req.params.fieldId;
  const query = req.query as SlotQueryInput;
  const slots = await SlotService.getSlots(fieldId as string, query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Slots fetched successfully",
    data: slots,
  });
});

const updateSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId;
  const slotId = req.params.slotId;
  const payload = req.body as UpdateSlotInput;
  const updated = await SlotService.updateSlot(userId, fieldId as string, slotId as string, payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Slot updated successfully",
    data: updated,
  });
});

const deleteSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.fieldId;
  const slotId = req.params.slotId;
  const result = await SlotService.deleteSlot(userId, fieldId as string, slotId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Slot deleted successfully",
    data: result,
  });
});

export const SlotController = {
  createSlot,
  bulkCreateSlots,
  getSlots,
  updateSlot,
  deleteSlot,
};
