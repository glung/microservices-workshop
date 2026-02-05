import request from "supertest";
import { createTestApp } from "../helpers/testApp";

const app = createTestApp();

describe("GET /health", () => {
  it("should return service health", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      status: "healthy",
      service: "courses",
    });
  });
});
