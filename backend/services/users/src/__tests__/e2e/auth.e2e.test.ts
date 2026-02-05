import request from "supertest";
import { createTestApp } from "../helpers/testApp";

const app = createTestApp();

describe("POST /api/auth/register", () => {
  it("should create user with Free subscription by default", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        name: "New User",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      user: {
        email: "newuser@example.com",
        name: "New User",
        subscription_kind: "Free",
      },
      token: expect.any(String),
    });
  });

  it("should create user with Max subscription when specified", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "maxuser@example.com",
        password: "SecurePass123",
        name: "Max User",
        subscriptionKind: "Max",
      })
      .expect(200);

    expect(response.body.user.subscription_kind).toBe("Max");
  });

  it("should fail with duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "duplicate@example.com",
        password: "SecurePass123",
        name: "First User",
      })
      .expect(200);

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "duplicate@example.com",
        password: "SecurePass123",
        name: "Second User",
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
  });
});

describe("POST /api/auth/login", () => {
  it("should login with valid credentials", async () => {
    await request(app).post("/api/auth/register").send({
      email: "logintest@example.com",
      password: "SecurePass123",
      name: "Login Test",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "logintest@example.com",
        password: "SecurePass123",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      user: {
        email: "logintest@example.com",
        name: "Login Test",
      },
      token: expect.any(String),
    });
  });

  it("should fail with invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "SomePassword",
      })
      .expect(401);

    expect(response.body.error).toBe("Invalid credentials");
  });

  it("should fail with invalid password", async () => {
    await request(app).post("/api/auth/register").send({
      email: "wrongpass@example.com",
      password: "CorrectPass123",
      name: "User",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrongpass@example.com",
        password: "WrongPassword",
      })
      .expect(401);

    expect(response.body.error).toBe("Invalid credentials");
  });
});
