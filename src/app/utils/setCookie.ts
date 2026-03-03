import type { Response } from "express";
import { env } from "../config/env";
import { parseTimeToMs } from "./parseTime";

export interface AuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
    const accessMaxAge = parseTimeToMs(env.JWT_ACCESS_EXPIRES_IN);
    const refreshMaxAge = parseTimeToMs(env.JWT_REFRESH_EXPIRES_IN);

    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: accessMaxAge,
            path: "/",
        });
    }

    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: refreshMaxAge,
            path: "/",
        });
    }
};