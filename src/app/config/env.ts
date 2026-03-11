// import dotenv from "dotenv";

// dotenv.config();

// export const env = {
//     NODE_ENV: process.env.NODE_ENV || "development",

//     PORT: Number(process.env.PORT) || 5000,

//     DATABASE_URL: process.env.DATABASE_URL as string,

//     JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
//     JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,

//     JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
//     JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

//     BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

//     SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
//     SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,

//     CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
// };


import dotenv from "dotenv";

dotenv.config();

export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",

    PORT: Number(process.env.PORT) || 5000,

    DATABASE_URL: process.env.DATABASE_URL as string,

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

    // Bcrypt
    BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,

    // Super Admin
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,

    // Client URL
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

    // Redis
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
    REDIS_USERNAME: process.env.REDIS_USERNAME || undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
};
