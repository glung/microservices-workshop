import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SubscriptionKind } from "@prisma/client";
import { UserRepository } from "../repositories/UserRepository";

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  subscriptionKind?: SubscriptionKind;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    subscription_kind: SubscriptionKind;
  };
  token: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  subscription_kind: SubscriptionKind;
  end_date: Date | null;
}

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly jwtSecret: string;

  constructor(userRepository?: UserRepository) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    this.jwtSecret = secret;
    this.userRepository = userRepository || new UserRepository();
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, name, subscriptionKind = "Free" } = data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const endDate =
      subscriptionKind === "Max"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      subscriptionKind,
      endDate,
    });

    const token = jwt.sign({ userId: user.id }, this.jwtSecret);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_kind: user.subscription_kind,
      },
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await this.userRepository.findByEmailWithSubscription(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id }, this.jwtSecret);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_kind: user.subscription_kind || "Free",
      },
      token,
    };
  }

  async authenticateUserById(userId: number): Promise<AuthenticatedUser | null> {
    const user = await this.userRepository.findByIdWithSubscription(userId);
    if (!user) return null;

    if (
      user.subscription_kind === "Max" &&
      user.end_date &&
      new Date(user.end_date) < new Date()
    ) {
      await this.userRepository.deactivateActiveSubscription(user.id);
      user.subscription_kind = "Free";
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_kind: user.subscription_kind || "Free",
      end_date: user.end_date || null,
    };
  }
}
