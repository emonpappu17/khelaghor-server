import { z } from "zod";

const getNotificationsQuerySchema = z.object({
    isRead: z
        .enum(["true", "false"], {
            message: "isRead must be 'true' or 'false'",
        })
        .optional(),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;

export const NotificationValidation = {
    getNotificationsQuerySchema,
};
