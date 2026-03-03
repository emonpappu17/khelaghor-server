import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type TJwtPayload = {
    userId: string;
    email: string;
    role: string;
};

// Generate Access Token
export const generateAccessToken = (payload: TJwtPayload): string => {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    } as SignOptions);
};

// Generate Refresh Token
export const generateRefreshToken = (payload: TJwtPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);
};

// Verify Access Token
export const verifyAccessToken = (token: string): TJwtPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TJwtPayload;
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): TJwtPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TJwtPayload;
};

// Decode Token (no verification)
export const decodeToken = (token: string): JwtPayload | null => {
    return jwt.decode(token) as JwtPayload | null;
};