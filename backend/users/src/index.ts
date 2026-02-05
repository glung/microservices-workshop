import express, { Request, Response } from "express";
import { initDB } from "./db";
import authRoutes from "./routes/auth";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";

const app = express();
app.use(express.json());

app.use(metricsMiddleware);


app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({ status: "healthy", service: "users" });
});

app.use("/auth", authRoutes);

app.get("/metrics", async (_req: Request, res: Response): Promise<void> => {
	res.set("Content-Type", register.contentType);
	const metrics = await register.metrics();
	res.end(metrics);
});

const PORT = process.env.PORT || 3000;

const start = async (): Promise<void> => {
	await initDB();

	app.listen(PORT, () => {
		console.log(`Template service running on port ${PORT}`);
	});
};

start();
