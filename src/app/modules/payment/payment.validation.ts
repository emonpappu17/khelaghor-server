import { z } from "zod";

const ipnSchema = z.object({
    tran_id: z.string().min(1, "Transaction ID is required"),
    val_id: z.string().min(1, "Validation ID is required"),
    status: z.string().min(1, "Status is required"),
    amount: z.string().optional(),
    card_type: z.string().optional(),
    bank_tran_id: z.string().optional(),
});

const redirectSchema = z.object({
    tran_id: z.string().min(1, "Transaction ID is required"),
    status: z.string().optional(),
    val_id: z.string().optional(),
});

export type IPNInput = z.infer<typeof ipnSchema>;
export type RedirectInput = z.infer<typeof redirectSchema>;

export const PaymentValidation = {
    ipnSchema,
    redirectSchema,
};
