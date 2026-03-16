import { z } from "zod";

const applyHostSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  nid_number: z.string().length(10, "NID must be exactly 10 characters"),
});

const updateHostSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters").optional(),
  nid_number: z.string().length(10, "NID must be exactly 10 characters").optional(),
});

export type ApplyHostInput = z.infer<typeof applyHostSchema>;
export type UpdateHostInput = z.infer<typeof updateHostSchema>;

export const HostValidation = {
  applyHostSchema,
  updateHostSchema,
};
