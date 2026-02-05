import express, { Request, Response } from "express";
import { initDB } from "./db";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";
import catalogRoutes from "./routes/catalog";
import coursesRoutes from "./routes/courses";

const app = express();
app.use(express.json());

app.use(metricsMiddleware);

app.use("/api/catalog", catalogRoutes);
app.use("/api/courses", coursesRoutes);

app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "healthy", service: "courses" });
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
    console.log(`Courses service running on port ${PORT}`);
  });
};

start();
