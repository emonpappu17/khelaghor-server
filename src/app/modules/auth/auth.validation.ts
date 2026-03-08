import { z } from "zod";

const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters"),

    business_name: z
        .string()
        .min(2, "Business name must be at least 2 characters")
        .optional(),

    email: z
        .email("Invalid email address"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),

    phone: z
        .string()
        .optional(),

    nid_number: z
        .string()
        .length(10, "NID must be exactly 10 characters")
        .optional(),

    role: z
        .enum(["USER", "HOST"])
        .default("USER"),
});

const loginSchema = z.object({
    email: z
        .email("Invalid email address"),

    password: z
        .string()
        .min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const AuthValidation = {
    registerSchema,
    loginSchema,
};