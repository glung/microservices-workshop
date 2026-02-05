import express from "express";
import jwt from "jsonwebtoken";

jest.mock("../../monitoring/metrics", () => ({
  register: {
    contentType: "text/plain",
    metrics: jest.fn().mockResolvedValue("mocked metrics"),
  },
  httpRequestDuration: { observe: jest.fn() },
  httpRequestTotal: { inc: jest.fn() },
  httpRequestsInProgress: { inc: jest.fn(), dec: jest.fn() },
  dbQueryDuration: { observe: jest.fn() },
  dbConnectionsActive: { set: jest.fn() },
  dbQueryTotal: { inc: jest.fn() },
  catalogViews: { inc: jest.fn() },
  courseViews: { inc: jest.fn() },
  courseLikes: { inc: jest.fn() },
  errorTotal: { inc: jest.fn() },
}));

import catalogRoutes from "../../routes/catalog";
import coursesRoutes from "../../routes/courses";

export const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "test_secret") as {
        userId: number;
      };
      req.headers["x-user-id"] = decoded.userId.toString();
    } catch {
      // ignore invalid tokens for test harness
    }

    next();
  });

  app.use("/api/catalog", catalogRoutes);
  app.use("/api/courses", coursesRoutes);

  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "courses" });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", "text/plain");
    res.end("mocked metrics");
  });

  return app;
};
