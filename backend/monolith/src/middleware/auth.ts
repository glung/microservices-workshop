import { Request, Response, NextFunction } from "express";
import { pool } from "../db";

interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  subscription_kind: "Free" | "Max";
  end_date: Date | null;
}

const getUserIdFromHeader = (req: Request): number | null => {
  const userIdHeader = req.headers["x-user-id"];
  if (!userIdHeader || typeof userIdHeader !== "string") return null;

  const userId = parseInt(userIdHeader, 10);
  if (Number.isNaN(userId)) return null;
  return userId;
};

const fetchAuthenticatedUser = async (userId: number): Promise<AuthenticatedUser | null> => {
  const result = await pool.query<{
    id: number;
    email: string;
    name: string;
    subscription_kind: "Free" | "Max" | null;
    end_date: Date | null;
  }>(
    `
      SELECT
        u.id,
        u.email,
        u.name,
        s.kind as subscription_kind,
        s.end_date
      FROM users u
      LEFT JOIN subscriptions s
        ON s.user_id = u.id
       AND s.active = true
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId],
  );

  const row = result.rows[0];
  if (!row) return null;

  let subscriptionKind: "Free" | "Max" = row.subscription_kind || "Free";
  let endDate: Date | null = row.end_date;

  if (subscriptionKind === "Max" && endDate && new Date(endDate) < new Date()) {
    await pool.query(
      `UPDATE subscriptions SET active = false WHERE user_id = $1 AND active = true`,
      [userId],
    );
    subscriptionKind = "Free";
    endDate = null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    subscription_kind: subscriptionKind,
    end_date: endDate,
  };
};

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserIdFromHeader(req);
    if (userId === null) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await fetchAuthenticatedUser(userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = getUserIdFromHeader(req);
    if (userId === null) {
      next();
      return;
    }

    const user = await fetchAuthenticatedUser(userId);
    if (user) {
      req.user = user;
    }
  } catch {
    // ignore
  }

  next();
};

export { authenticate, optionalAuth };
