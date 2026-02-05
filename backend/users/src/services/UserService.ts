import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository, UserWithSubscription, CreateUserData } from "../repositories/UserRepository";
import { SubscriptionKind } from "@prisma/client";

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

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  subscription_kind: SubscriptionKind;
  end_date?: Date | null;
}

export class UserService {
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

    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash du mot de passe - logique métier
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calcul de la date de fin - règle métier
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

    // Vérification du mot de passe - logique métier
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
  async authenticateUserById(userId: number): Promise<UserResponse | null> {
    // Récupération de l'utilisateur avec son abonnement
    const user = await this.userRepository.findByIdWithSubscription(userId);

    if (!user) {
      return null;
    }

    // Règle métier: vérifier si l'abonnement Max a expiré
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

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id: number): Promise<UserResponse | null> {
    const user = await this.userRepository.findByIdWithSubscription(id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_kind: user.subscription_kind || "Free",
      end_date: user.end_date || null,
    };
  }

  /**
   * Liste tous les utilisateurs
   */
  async listUsers(): Promise<UserResponse[]> {
    const users = await this.userRepository.listAll();
    
    // Récupérer les informations d'abonnement pour chaque utilisateur
    const usersWithSubscription = await Promise.all(
      users.map(async (user) => {
        const userWithSub = await this.userRepository.findByIdWithSubscription(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_kind: userWithSub?.subscription_kind || "Free",
          end_date: userWithSub?.end_date || null,
        };
      })
    );

    return usersWithSubscription;
  }

  /**
   * Met à jour l'abonnement d'un utilisateur vers Max
   */
  async upgradeToMax(userId: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Les abonnements Max durent 30 jours
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await this.userRepository.upgradeSubscription(userId, endDate);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_kind: "Max",
      end_date: endDate,
    };
  }

  /**
   * Vérifie un token JWT et retourne les informations de l'utilisateur
   */
  async verifyToken(token: string): Promise<UserResponse | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: number };
      return this.authenticateUserById(decoded.userId);
    } catch {
      return null;
    }
  }
}
