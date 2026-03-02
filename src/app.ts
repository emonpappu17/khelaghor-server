import express from "express";
import cors from "cors";
import { notFound } from "./app/middlewares/notFound";
import { errorHandler } from "./app/middlewares/errorHandler";
import sendResponse from "./app/utils/sendResponse";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Server is running 🚀",
        data: null,
    });
});

// Not Found
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;