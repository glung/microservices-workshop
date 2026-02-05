import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

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

const fetchAuthenticatedUser = async (
  userId: number,
): Promise<AuthenticatedUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptions: {
        where: { active: true },
        take: 1,
        select: { kind: true, end_date: true },
      },
    },
  });

  if (!user) return null;

  const activeSubscription = user.subscriptions[0];
  let subscriptionKind: "Free" | "Max" = activeSubscription?.kind ?? "Free";
  let endDate: Date | null = activeSubscription?.end_date ?? null;

  if (subscriptionKind === "Max" && endDate && new Date(endDate) < new Date()) {
    await prisma.subscription.updateMany({
      where: { user_id: userId, active: true },
      data: { active: false },
    });
    subscriptionKind = "Free";
    endDate = null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscription_kind: subscriptionKind,
    end_date: endDate,
  };
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
};
