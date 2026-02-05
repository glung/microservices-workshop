import request from "supertest";
import { createTestApp } from "../helpers/testApp";
import { createTestUser } from "../helpers/testUsers";
import { createTestCourse } from "../helpers/testCourses";
import { testPool } from "../helpers/testDb";

const app = createTestApp();

describe("GET /api/accounts/me", () => {
  it("should return user account information", async () => {
    const user = await createTestUser({
      email: "test@example.com",
      name: "Test User",
      subscriptionKind: "Free",
    });

    const response = await request(app)
      .get("/api/accounts/me")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      user: {
        id: user.id,
        email: "test@example.com",
        name: "Test User",
      },
      subscription: {
        kind: "Free",
        end_date: null,
      },
    });
  });

  it("should return Max subscription with end_date", async () => {
    const user = await createTestUser({
      subscriptionKind: "Max",
    });

    const response = await request(app)
      .get("/api/accounts/me")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.subscription.kind).toBe("Max");
    expect(response.body.subscription.end_date).toBeTruthy();
  });

  it("should require authentication", async () => {
    await request(app).get("/api/accounts/me").expect(401);
  });
});

describe("GET /api/accounts/likes", () => {
  it("should return empty array when no likes", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .get("/api/accounts/likes")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.liked_courses).toEqual([]);
  });

  it("should return liked courses with liked_at timestamp", async () => {
    const user = await createTestUser();
    const course1 = await createTestCourse({ name: "Course 1" });
    const course2 = await createTestCourse({ name: "Course 2" });

    await testPool.query(
      "INSERT INTO likes (user_id, course_id) VALUES ($1, $2), ($1, $3)",
      [user.id, course1.id, course2.id],
    );

    const response = await request(app)
      .get("/api/accounts/likes")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.liked_courses).toHaveLength(2);
    expect(response.body.liked_courses[0]).toHaveProperty("liked_at");
    expect(response.body.liked_courses[0]).toHaveProperty("name");
  });

  it("should only return likes for authenticated user", async () => {
    const user1 = await createTestUser({ email: "user1@test.com" });
    const user2 = await createTestUser({ email: "user2@test.com" });
    const course = await createTestCourse();

    await testPool.query(
      "INSERT INTO likes (user_id, course_id) VALUES ($1, $2)",
      [user2.id, course.id],
    );

    const response = await request(app)
      .get("/api/accounts/likes")
      .set("Authorization", `Bearer ${user1.token}`)
      .expect(200);

    expect(response.body.liked_courses).toEqual([]);
  });

  it("should require authentication", async () => {
    await request(app).get("/api/accounts/likes").expect(401);
  });
});

describe("POST /api/accounts/upgrade", () => {
  it("should upgrade Free user to Max subscription", async () => {
    const user = await createTestUser({ subscriptionKind: "Free" });

    const response = await request(app)
      .post("/api/accounts/upgrade")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      subscription: {
        kind: "Max",
        end_date: expect.any(String),
      },
    });

    const endDate = new Date(response.body.subscription.end_date);
    const expectedDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const diffDays =
      Math.abs(endDate.getTime() - expectedDate.getTime()) /
      (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThan(1);
  });

  it("should fail if user already has Max subscription", async () => {
    const user = await createTestUser({ subscriptionKind: "Max" });

    const response = await request(app)
      .post("/api/accounts/upgrade")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(400);

    expect(response.body.error).toBe("Already have Max subscription");
  });

  it("should require authentication", async () => {
    await request(app).post("/api/accounts/upgrade").expect(401);
  });

  it("should deactivate old subscription and create new one", async () => {
    const user = await createTestUser({ subscriptionKind: "Free" });

    await request(app)
      .post("/api/accounts/upgrade")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    const result = await testPool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id",
      [user.id],
    );

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].active).toBe(false);
    expect(result.rows[1].active).toBe(true);
    expect(result.rows[1].kind).toBe("Max");
  });
});
