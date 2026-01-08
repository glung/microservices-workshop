import axios from "axios";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000";

describe("Gateway Health Checks", () => {
  it("should return gateway health status", async () => {
    const response = await axios.get(`${GATEWAY_URL}/gateway/health`);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      status: "healthy",
      service: "gateway",
      timestamp: expect.any(String),
    });
  });

  it("should proxy backend metrics", async () => {
    const response = await axios.get(`${GATEWAY_URL}/metrics`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.data).toBeDefined();
  });
});
