import { PrismaClient, SubscriptionKind, User } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export interface UserWithSubscription extends User {
  subscription_kind: SubscriptionKind;
  end_date?: Date | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  subscriptionKind?: SubscriptionKind;
  endDate?: Date | null;
}

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || defaultPrisma;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByEmailWithSubscription(email: string): Promise<UserWithSubscription | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { active: true },
          take: 1,
        },
      },
    });

    if (!user) return null;
    const subscription = user.subscriptions[0];

    return {
      ...user,
      subscription_kind: subscription?.kind || "Free",
      end_date: subscription?.end_date,
    };
  }

  async create(data: CreateUserData): Promise<UserWithSubscription> {
    const {
      email,
      password,
      name,
      subscriptionKind = "Free",
      endDate = null,
    } = data;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, password, name },
      });

      await tx.subscription.create({
        data: {
          user_id: created.id,
          kind: subscriptionKind,
          end_date: endDate,
          active: true,
        },
      });

      return created;
    });

    return {
      ...user,
      subscription_kind: subscriptionKind,
      end_date: endDate,
    };
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithSubscription(id: number): Promise<UserWithSubscription | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { active: true },
          take: 1,
        },
      },
    });

    if (!user) return null;
    const subscription = user.subscriptions[0];

    return {
      ...user,
      subscription_kind: subscription?.kind || "Free",
      end_date: subscription?.end_date,
    };
  }

  async deactivateActiveSubscription(userId: number): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { user_id: userId, active: true },
      data: { active: false },
    });
  }
}
