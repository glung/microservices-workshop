import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { testPool } from "./testDb";
import { SubscriptionKind, User } from "../../types/models";

export interface TestUser {
  id: number;
  email: string;
  password: string;
  name: string;
  token: string;
  subscription_kind: SubscriptionKind;
}

let userCounter = 0;

export const createTestUser = async (
  overrides?: {
    email?: string;
    password?: string;
    name?: string;
    subscriptionKind?: SubscriptionKind;
  },
): Promise<TestUser> => {
  userCounter++;

  const email = overrides?.email || `test${userCounter}@example.com`;
  const password = overrides?.password || "TestPassword123";
  const name = overrides?.name || `Test User ${userCounter}`;
  const subscriptionKind = overrides?.subscriptionKind || "Free";

  const hashedPassword = await bcrypt.hash(password, 10);

  const userResult = await testPool.query<User>(
    "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name",
    [email, hashedPassword, name],
  );

  const user = userResult.rows[0];

  const endDate =
    subscriptionKind === "Max"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;

  await testPool.query(
    "INSERT INTO subscriptions (user_id, kind, end_date) VALUES ($1, $2, $3)",
    [user.id, subscriptionKind, endDate],
  );

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "test_secret",
  );

  return {
    id: user.id,
    email,
    password,
    name,
    token,
    subscription_kind: subscriptionKind,
  };
};

export const resetUserCounter = (): void => {
  userCounter = 0;
};
