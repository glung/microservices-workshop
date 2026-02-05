import jwt from "jsonwebtoken";
import { testPool } from "./testDb";

export type SubscriptionKind = "Free" | "Max";

export interface TestUser {
  id: number;
  email: string;
  name: string;
  token: string;
  subscription_kind: SubscriptionKind;
}

let userCounter = 0;

export const createTestUser = async (
  overrides?: {
    email?: string;
    name?: string;
    subscriptionKind?: SubscriptionKind;
  },
): Promise<TestUser> => {
  userCounter++;

  const email = overrides?.email || `test${userCounter}@example.com`;
  const name = overrides?.name || `Test User ${userCounter}`;
  const subscriptionKind = overrides?.subscriptionKind || "Free";

  const userResult = await testPool.query<{ id: number }>(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id",
    [email, "password", name],
  );

  const userId = userResult.rows[0]!.id;

  const endDate =
    subscriptionKind === "Max"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;

  await testPool.query(
    "INSERT INTO subscriptions (user_id, kind, end_date) VALUES ($1, $2, $3)",
    [userId, subscriptionKind, endDate],
  );

  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "test_secret",
  );

  return {
    id: userId,
    email,
    name,
    token,
    subscription_kind: subscriptionKind,
  };
};

export const resetUserCounter = (): void => {
  userCounter = 0;
};
