import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional(),
    // avatar: z.string().optional(),
    // nid_number: z
    //     .string()
    //     .length(10, "NID must be exactly 10 characters")
    //     .optional(),
    // business_name: z
    //     .string()
    //     .min(2, "Business name must be at least 2 characters")
    //     .optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED", "INACTIVE"]),
});

const updateRoleSchema = z.object({
    role: z.enum(["USER", "HOST", "ADMIN", "SUPER_ADMIN"]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const UserValidation = {
    updateProfileSchema,
    updateStatusSchema,
    updateRoleSchema,
};
