import express, { Request, Response } from "express";
import { initDB } from "./db";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";
import authRoutes from "./routes/auth";
import internalUsersRoutes from "./routes/internalUsers";

const app = express();
app.use(express.json());

app.use(metricsMiddleware);

app.use("/api/auth", authRoutes);
app.use("/internal/users", internalUsersRoutes);

app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "healthy", service: "users" });
});

app.get("/metrics", async (_req: Request, res: Response): Promise<void> => {
  res.set("Content-Type", register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
});

const PORT = process.env.PORT || 3000;

const start = async (): Promise<void> => {
  await initDB();

  app.listen(PORT, () => {
    console.log(`Users service running on port ${PORT}`);
  });
};

start();
