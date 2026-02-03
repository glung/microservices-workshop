import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository";
import { SubscriptionKind } from "../types/models";

/**
 * Le Service contient la logique métier (Domain/Application Layer)
 * Il orchestre les repositories et implémente les règles métier
 */

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

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor(userRepository?: UserRepository) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }
    this.jwtSecret = secret;
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Enregistre un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, name, subscriptionKind = "Free" } = data;

    // 🤓 Hash du mot de passe - logique métier
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🤓 Calcul de la date de fin - règle métier
    // Les abonnements Max durent 30 jours
    const endDate =
      subscriptionKind === "Max"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

    // Utilisation du repository pour persister
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      subscriptionKind,
      endDate,
    });

    // Génération du token JWT
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

  /**
   * Authentifie un utilisateur
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Récupération de l'utilisateur avec son abonnement
    const user = await this.userRepository.findByEmailWithSubscription(email);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // 🤓 Vérification du mot de passe - logique métier
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    // Génération du token JWT
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

  /**
   * Authentifie un utilisateur par son ID (utilisé par le middleware)
   * Gère automatiquement l'expiration des abonnements Max
   */
  async authenticateUserById(userId: number) {
    // Récupération de l'utilisateur avec son abonnement
    const user = await this.userRepository.findByIdWithSubscription(userId);

    if (!user) {
      return null;
    }

    // 🤓 Règle métier: vérifier si l'abonnement Max a expiré
    if (
      user.subscription_kind === "Max" &&
      user.end_date &&
      new Date(user.end_date) < new Date()
    ) {
      // Désactiver l'abonnement expiré
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
