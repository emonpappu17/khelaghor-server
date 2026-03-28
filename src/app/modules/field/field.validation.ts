import { z } from "zod";
import { SportType } from "../../../generated/prisma/enums";

const createFieldSchema = z.object({
  name: z.string().min(2, "Field name must be at least 2 characters"),
  // sportType: z.enum(SportType, {
  //   errorMap: () => ({ message: "Invalid sport type" }),
  // }),
  sportType: z.enum(Object.values(SportType) as [string, ...string[]], {
    message: "Invalid sport type",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  maxPlayers: z.number().int().positive("Max players must be a positive integer").optional(),
  facilities: z.array(z.string()).optional().default([]),
  images: z.array(z.string().url("Invalid image URL")).optional().default([]),
  division: z.string().min(2, "Division must be at least 2 characters"),
  district: z.string().min(2, "District must be at least 2 characters"),
  address: z.string().min(4, "Address must be at least 4 characters"),
  area: z.string().min(2, "Area must be at least 2 characters"),
  latitude: z.number(),
  longitude: z.number(),
});

const updateFieldSchema = createFieldSchema.partial();

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

export const FieldValidation = {
  createFieldSchema,
  updateFieldSchema,
};

