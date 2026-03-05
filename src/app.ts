import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./app/config/env";
import { notFound } from "./app/middlewares/notFound";
import { errorHandler } from "./app/middlewares/errorHandler";
import sendResponse from "./app/utils/sendResponse";

const app: Application = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Khelaghor API is running 🚀",
    data: null,
  });
});

app.use(notFound);

app.use(errorHandler);

export default app;