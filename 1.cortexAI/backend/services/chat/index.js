
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDb from "./config/db.js";
import router from "./routes/chat.routes.js";

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "cortex-chart",
        status: "healthy",
        database:
            mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected"
    });
});

app.use("/", router);

app.get("/", (req, res) => {
    res.json({ message: "hello from chat" });
});

const startServer = async () => {
    try {
        await connectDb();

        app.listen(port, "0.0.0.0", () => {
            console.log(`Chat started at ${port}`);
        });
    } catch (error) {
        console.error("Chat server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
