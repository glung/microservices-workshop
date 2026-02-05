import { PrismaClient, SubscriptionKind } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export interface LikedCourse {
  id: number;
  name: string;
  author: string;
  kind: SubscriptionKind;
  created_at: Date;
  liked_at: Date;
}

export class AccountRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  async getLikedCourses(userId: number): Promise<LikedCourse[]> {
    const likes = await this.prisma.like.findMany({
      where: {
        user_id: userId,
      },
      include: {
        course: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return likes.map((like) => ({
      id: like.course.id,
      name: like.course.name,
      author: like.course.author,
      kind: like.course.kind,
      created_at: like.course.created_at,
      liked_at: like.created_at,
    }));
  }

  async upgradeSubscription(userId: number, endDate: Date): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          user_id: userId,
          active: true,
        },
        data: {
          active: false,
        },
      });

      await tx.subscription.create({
        data: {
          user_id: userId,
          kind: "Max",
          end_date: endDate,
          active: true,
        },
      });
    });
  }
}
