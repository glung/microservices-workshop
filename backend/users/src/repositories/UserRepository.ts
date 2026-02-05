import { PrismaClient, SubscriptionKind, User } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

/**
 * Le Repository gère l'accès aux données du domaine User
 * Il abstrait la persistance pour le domaine métier
 */

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

  /**
   * Trouve un utilisateur par email
   * @param email - L'email de l'utilisateur
   * @returns L'utilisateur ou null si non trouvé
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Trouve un utilisateur par email avec son abonnement actif
   * @param email - L'email de l'utilisateur
   * @returns L'utilisateur avec ses informations d'abonnement ou null
   */
  async findByEmailWithSubscription(
    email: string,
  ): Promise<UserWithSubscription | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { active: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    const subscription = user.subscriptions[0];

    return {
      ...user,
      subscription_kind: subscription?.kind || "Free",
      end_date: subscription?.end_date,
    };
  }

  /**
   * Crée un nouvel utilisateur avec son abonnement
   *
   * @param data - Les données de l'utilisateur à créer
   * @returns L'utilisateur créé avec son type d'abonnement
   */
  async create(data: CreateUserData): Promise<UserWithSubscription> {
    const {
      email,
      password,
      name,
      subscriptionKind = "Free",
      endDate = null,
    } = data;

    // Les transactions Prisma garantissent l'atomicité
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password,
          name,
        },
      });

      await tx.subscription.create({
        data: {
          user_id: user.id,
          kind: subscriptionKind,
          end_date: endDate,
        },
      });

      return user;
    });

    return {
      ...result,
      subscription_kind: subscriptionKind,
      end_date: endDate,
    };
  }

  /**
   * Trouve un utilisateur par ID
   *
   * @param id - L'ID de l'utilisateur
   * @returns L'utilisateur ou null si non trouvé
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Trouve un utilisateur par ID avec son abonnement actif
   *
   * @param id - L'ID de l'utilisateur
   * @returns L'utilisateur avec ses informations d'abonnement ou null
   */
  async findByIdWithSubscription(
    id: number,
  ): Promise<UserWithSubscription | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { active: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    const subscription = user.subscriptions[0];

    return {
      ...user,
      subscription_kind: subscription?.kind || "Free",
      end_date: subscription?.end_date,
    };
  }

  /**
   * Liste tous les utilisateurs
   * @returns La liste de tous les utilisateurs
   */
  async listAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { id: "asc" },
    });
  }

  /**
   * Désactive l'abonnement actif d'un utilisateur
   *
   * @param userId - L'ID de l'utilisateur
   */
  async deactivateActiveSubscription(userId: number): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: {
        user_id: userId,
        active: true,
      },
      data: {
        active: false,
      },
    });
  }

  /**
   * Met à jour l'abonnement d'un utilisateur vers Max
   *
   * @param userId - L'ID de l'utilisateur
   * @param endDate - La date de fin du nouvel abonnement
   */
  async upgradeSubscription(userId: number, endDate: Date): Promise<void> {
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
