import type { Response } from "express";

type TMeta = {
    page?: number;
    limit?: number;
    total?: number;
};

type TResponse<T> = {
    success: boolean;
    message?: string;
    meta?: TMeta;
    data?: T;
};

const sendResponse = <T>(
    res: Response,
    {
        statusCode,
        success,
        message,
        meta,
        data,
    }: TResponse<T> & { statusCode: number }
) => {
    return res.status(statusCode).json({
        success,
        message,
        meta,
        data,
    });
};

export default sendResponse;