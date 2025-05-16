import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Default route for root URL
app.get("/", (req, res) => {
    res.send("Welcome to the API!");
});

// Import routers
import userRouter from "./routes/user.route.js";

// Route declaration
app.use("/api/v1/users", userRouter);

export default app;