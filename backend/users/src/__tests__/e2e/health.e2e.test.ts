import request from "supertest";
import { createTestApp } from "../helpers/testApp";

const app = createTestApp();

describe("Health E2E Tests", () => {
  describe("GET /health", () => {
    it("should return healthy status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "healthy",
        service: "users",
      });
    });
  });

  describe("GET /metrics", () => {
    it("should return metrics", async () => {
      const response = await request(app).get("/metrics");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/plain");
    });
  });
});
