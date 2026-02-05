import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import jwt from "jsonwebtoken";
import { metricsMiddleware } from "./middleware/metrics";
import { register } from "./monitoring/metrics";

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MONOLITH_URL = process.env.MONOLITH_URL;
// 👇 NOUVEAU : On récupère l'URL du service Users
const USERS_URL = process.env.USERS_URL || "http://users:3000";

app.use(metricsMiddleware);

app.get("/gateway/health", (req, res) => {
	res.status(200).json({
		status: "healthy",
		service: "gateway",
		timestamp: new Date().toISOString(),
	});
});

app.get("/metrics", async (req, res) => {
	res.set("Content-Type", register.contentType);
	res.end(await register.metrics());
});

function getAuthLevel(
	path: string,
	method: string,
): "none" | "optional" | "required" {
	if (
		path.startsWith("/api/auth/") ||
		path === "/health" ||
		path === "/metrics" ||
		path === "/gateway/health"
	) {
		return "none";
	}

	if (path.startsWith("/api/accounts/")) return "required";
	if (
		path.match(/^\/api\/courses\/\d+\/(like|unlock)$/) &&
		(method === "POST" || method === "DELETE")
	) {
		return "required";
	}

	if (path === "/api/catalog") return "optional";
	if (path.match(/^\/api\/courses\/\d+$/) && method === "GET")
		return "optional";

	return "none";
}

app.use((req, res, next) => {
	const authLevel = getAuthLevel(req.path, req.method);

	if (authLevel === "none") {
		return next();
	}

	const authHeader = req.headers.authorization;
	const token = authHeader?.replace("Bearer ", "");

	if (!token) {
		if (authLevel === "required") {
		return res.status(401).json({ error: "Authentication required" });
		}
		return next();
	}

	try {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
		throw new Error("JWT_SECRET is not defined");
		}

		const decoded = jwt.verify(token, secret) as { userId: number };
		req.headers["x-user-id"] = decoded.userId.toString();
		next();
	} catch (err) {
		if (authLevel === "required") {
		return res.status(401).json({ error: "Invalid token" });
		}
		next();
	}
});

app.use(
	"/api/auth",
	createProxyMiddleware({
		target: USERS_URL,
		changeOrigin: true,
		pathRewrite: {
		"^/api/auth": "/auth", 
		},
	}),
);

app.use(
	"/",
	createProxyMiddleware({
		target: MONOLITH_URL,
		changeOrigin: true,
	}),
);

app.listen(PORT, () => {
	console.log(`✅ Gateway running on port ${PORT}`);
	console.log(`➡️  Auth routes proxying to ${USERS_URL}`);
	console.log(`➡️  Other routes proxying to ${MONOLITH_URL}`);
});