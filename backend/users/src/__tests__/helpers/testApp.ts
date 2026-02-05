import express from "express";

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
}));

jest.mock("../../db", () => {
  const { testPool } = require("./testDb");
  return {
    pool: testPool,
    initDB: jest.fn().mockResolvedValue(undefined),
  };
});

import usersRoutes from "../../routes/users";

export const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.use("/users", usersRoutes);

  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "users" });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", "text/plain");
    res.end("mocked metrics");
  });

  return app;
};
