import { AccountRepository, LikedCourse } from "../repositories/AccountRepository";

export type SubscriptionKind = "Free" | "Max";

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

  async getLikedCourses(userId: number): Promise<LikedCourse[]> {
    return this.accountRepository.getLikedCourses(userId);
  }

  async upgradeSubscription(
    userId: number,
    currentSubscriptionKind: SubscriptionKind,
  ): Promise<{ kind: SubscriptionKind; end_date: Date }> {
    if (currentSubscriptionKind === "Max") {
      throw new Error("Already have Max subscription");
    }

    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.accountRepository.upgradeSubscription(userId, endDate);

    return {
      kind: "Max",
      end_date: endDate,
    };
  }
}
