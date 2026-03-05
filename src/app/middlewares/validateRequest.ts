import type { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

const validateRequest =
    (schema: ZodObject) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const payload = req.body.data ? JSON.parse(req.body.data) : req.body;

                await schema.parseAsync(payload);

                req.body = payload;
                next();
            } catch (error) {
                next(error);
            }
        };

export default validateRequest;