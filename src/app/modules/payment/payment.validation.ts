import { z } from "zod";

const redirectSchema = z.object({
    tran_id: z.string().min(1, "Transaction ID is required"),
    status: z.string().optional(),
    val_id: z.string().optional(),
});

export type RedirectInput = z.infer<typeof redirectSchema>;

export const PaymentValidation = {
    redirectSchema,
};
