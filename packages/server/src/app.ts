import cors from "cors";
import express from "express";
import healthRouter from "./routes/health";
import prepPackRouter from "./routes/prepPacks";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/prep-packs", prepPackRouter);

export { app };
