import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { FieldService } from "./field.service";
import type { CreateFieldInput, UpdateFieldInput } from "./field.validation";
import pick from "../../utils/pick";

const createField = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const payload = req.body as CreateFieldInput;
  const files = req.files as Express.Multer.File[] | undefined;
  const field = await FieldService.createField(userId, payload, files);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Field created successfully",
    data: field,
  });
});

const updateField = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.id;
  const payload = req.body as UpdateFieldInput;
  const files = req.files as Express.Multer.File[] | undefined;
  const field = await FieldService.updateField(userId, fieldId as string, payload, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Field updated successfully",
    data: field,
  });
});

const listFields = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["sportType", "division", "district", "area", "status"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const { total, page, limit, fields } = await FieldService.getFields(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Fields fetched successfully",
    meta: { total, page, limit },
    data: fields,
  });
});

const getField = catchAsync(async (req: Request, res: Response) => {
  const fieldId = req.params.id;
  const field = await FieldService.getFieldById(fieldId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Field fetched successfully",
    data: field,
  });
});

const removeField = catchAsync(async (req: Request, res: Response) => {
  const userId = req.authUser.userId;
  const fieldId = req.params.id;
  const deleted = await FieldService.deleteField(userId, fieldId as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Field deactivated successfully",
    data: deleted,
  });
});

export const FieldController = {
  createField,
  updateField,
  listFields,
  getField,
  removeField,
};
