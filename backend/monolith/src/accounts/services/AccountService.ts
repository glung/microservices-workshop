import {
  AccountRepository,
  LikedCourse,
} from "../repositories/AccountRepository";
import { SubscriptionKind } from "../../types/models";

/**
 * Le Service contient la logique métier du domaine Account
 * Il orchestre le repository et implémente les règles métier
 */

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  subscription_kind: SubscriptionKind;
  end_date: Date | null;
}

export interface AccountInfo {
  user: {
    id: number;
    email: string;
    name: string;
  };
  subscription: {
    kind: SubscriptionKind;
    end_date: Date | null;
  };
}

export class AccountService {
  private accountRepository: AccountRepository;

  constructor(accountRepository?: AccountRepository) {
    this.accountRepository = accountRepository || new AccountRepository();
  }

  /**
   * Récupère les informations du compte utilisateur
   * @param user - Les informations utilisateur depuis le middleware
   * @returns Les informations formatées du compte
   */
  getAccountInfo(user: UserInfo): AccountInfo {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: {
        kind: user.subscription_kind || "Free",
        end_date: user.end_date,
      },
    };
  }

  /**
   * Récupère les cours likés par l'utilisateur
   * @param userId - L'ID de l'utilisateur
   * @returns La liste des cours likés
   */
  async getLikedCourses(userId: number): Promise<LikedCourse[]> {
    return this.accountRepository.getLikedCourses(userId);
  }

  /**
   * Upgrade l'abonnement d'un utilisateur vers Max
   * 🤓 Règle métier: Impossible d'upgrader si déjà Max
   * 🤓 Règle métier: Les abonnements Max durent 30 jours
   *
   * @param userId - L'ID de l'utilisateur
   * @param currentSubscriptionKind - Le type d'abonnement actuel
   * @returns Les informations du nouvel abonnement
   */
  async upgradeSubscription(
    userId: number,
    currentSubscriptionKind: SubscriptionKind,
  ): Promise<{ kind: SubscriptionKind; end_date: Date }> {
    // 🤓 Règle métier: Vérifier que l'utilisateur n'a pas déjà Max
    if (currentSubscriptionKind === "Max") {
      throw new Error("Already have Max subscription");
    }

    // 🤓 Règle métier: Calcul de la date de fin (30 jours)
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Persister le changement via le repository
    await this.accountRepository.upgradeSubscription(userId, endDate);

    return {
      kind: "Max",
      end_date: endDate,
    };
  }
}
