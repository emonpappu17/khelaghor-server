import { EventEmitter } from "events";
import { prisma } from "./prisma";
import type { NotificationType } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

export type NotificationPayload = {
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
};

class NotificationEmitterClass extends EventEmitter {
    private static instance: NotificationEmitterClass;

    private constructor() {
        super();
        this.setupListeners();
    }

    static getInstance(): NotificationEmitterClass {
        if (!NotificationEmitterClass.instance) {
            NotificationEmitterClass.instance = new NotificationEmitterClass();
        }
        return NotificationEmitterClass.instance;
    }

    private setupListeners(): void {
        this.on("notify", async (payload: NotificationPayload) => {
            try {
                await prisma.notification.create({
                    data: {
                        recipientId: payload.recipientId,
                        type: payload.type,
                        title: payload.title,
                        body: payload.body,
                        metadata: payload.metadata as Prisma.JsonValue ?? undefined,
                    },
                });
            } catch (error) {
                // Log but never throw — notifications must not break business flows
                console.error(
                    `[NOTIFICATION] Failed to create notification for user ${payload.recipientId}:`,
                    error
                );
            }
        });
    }
}

export const NotificationEmitter = NotificationEmitterClass.getInstance();
