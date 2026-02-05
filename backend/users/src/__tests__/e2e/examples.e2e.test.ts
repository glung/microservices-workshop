import request from "supertest";
import { createTestApp } from "../helpers/testApp";

const app = createTestApp();

describe("Examples CRUD", () => {
  it("should create and fetch an example", async () => {
    const createResponse = await request(app)
      .post("/examples")
      .send({ name: "Sample" })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      example: {
        id: expect.any(Number),
        name: "Sample",
        created_at: expect.any(String),
      },
    });

    const exampleId = createResponse.body.example.id;

    const fetchResponse = await request(app)
      .get(`/examples/${exampleId}`)
      .expect(200);

    expect(fetchResponse.body.example).toMatchObject({
      id: exampleId,
      name: "Sample",
    });
  });

  it("should list examples", async () => {
    await request(app).post("/examples").send({ name: "One" }).expect(201);
    await request(app).post("/examples").send({ name: "Two" }).expect(201);

    const response = await request(app).get("/examples").expect(200);

    expect(Array.isArray(response.body.examples)).toBe(true);
    expect(response.body.examples.length).toBeGreaterThanOrEqual(2);
  });

  it("should validate name", async () => {
    const response = await request(app).post("/examples").send({}).expect(400);

    expect(response.body.error).toBe("Name is required");
  });
});
