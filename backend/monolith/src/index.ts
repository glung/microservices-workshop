import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { initDB } from "./db";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";
import swaggerSpec from "./swagger";

const app = express();
app.use(express.json());

app.use(metricsMiddleware);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import catalogRoutes from "./courses/routes/catalog";
import coursesRoutes from "./courses/routes/courses";

app.use("/api/catalog", catalogRoutes);
app.use("/api/courses", coursesRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: monolith
 */
app.get("/health", (_req: Request, res: Response): void => {
  res.json({ status: "healthy", service: "monolith" });
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
    console.log(`Monolith running on port ${PORT}`);
  });
};

start();
