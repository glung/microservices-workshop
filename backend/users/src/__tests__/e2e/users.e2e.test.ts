import request from "supertest";
import { createTestApp } from "../helpers/testApp";

const app = createTestApp();

describe("Users E2E Tests", () => {
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

  describe("POST /users/register", () => {
    it("should register a new user", async () => {
      const response = await request(app)
        .post("/users/register")
        .send({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.name).toBe("Test User");
      expect(response.body.user.subscription_kind).toBe("Free");
      expect(response.body).toHaveProperty("token");
    });

    it("should return 400 if email is missing", async () => {
      const response = await request(app)
        .post("/users/register")
        .send({
          password: "password123",
          name: "Test User",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Email, password and name are required");
    });

    it("should return 409 if email already exists", async () => {
      // First registration
      await request(app)
        .post("/users/register")
        .send({
          email: "duplicate@example.com",
          password: "password123",
          name: "Test User",
        });

      // Second registration with same email
      const response = await request(app)
        .post("/users/register")
        .send({
          email: "duplicate@example.com",
          password: "password456",
          name: "Another User",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Email already exists");
    });
  });

  describe("POST /users/login", () => {
    beforeEach(async () => {
      await request(app)
        .post("/users/register")
        .send({
          email: "login@example.com",
          password: "password123",
          name: "Login User",
        });
    });

    it("should login successfully", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({
          email: "login@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("login@example.com");
      expect(response.body).toHaveProperty("token");
    });

    it("should return 401 for invalid credentials", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({
          email: "login@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("GET /users/:id", () => {
    it("should get user by id", async () => {
      const registerResponse = await request(app)
        .post("/users/register")
        .send({
          email: "getuser@example.com",
          password: "password123",
          name: "Get User",
        });

      const userId = registerResponse.body.user.id;

      const response = await request(app).get(`/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.email).toBe("getuser@example.com");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app).get("/users/99999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });
  });
});
