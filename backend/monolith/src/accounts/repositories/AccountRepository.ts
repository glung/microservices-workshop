import { PrismaClient, SubscriptionKind } from "@prisma/client";
import { prisma as defaultPrisma } from "../../prisma";

/**
 * 📣 Le Repository gère l'accès aux données du domaine Account
 * Il abstrait la persistance pour le domaine métier
 */

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

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || defaultPrisma;
  }

  /**
   * Récupère les cours likés par un utilisateur
   * @param userId - L'ID de l'utilisateur
   * @returns La liste des cours likés avec leur date de like
   */
  async getLikedCourses(userId: number): Promise<LikedCourse[]> {
    // 📜 Utilisation de Prisma pour une requête avec jointure
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

  /**
   * Met à jour l'abonnement d'un utilisateur vers Max
   * 🤓 Utilise une transaction pour garantir l'atomicité
   *
   * @param userId - L'ID de l'utilisateur
   * @param endDate - La date de fin du nouvel abonnement
   */
  async upgradeSubscription(userId: number, endDate: Date): Promise<void> {
    // 📜 Transaction Prisma pour garantir l'atomicité
    await this.prisma.$transaction(async (tx) => {
      // Désactiver tous les abonnements actifs
      await tx.subscription.updateMany({
        where: {
          user_id: userId,
          active: true,
        },
        data: {
          active: false,
        },
      });

      // Créer le nouvel abonnement Max
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
