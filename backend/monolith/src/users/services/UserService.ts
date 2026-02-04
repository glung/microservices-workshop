import {
  UserRepository,
  UserWithSubscription,
  CreateUserData,
} from "../repositories/UserRepository";
import { User } from "@prisma/client";

/**
 * Le Service contient la logique métier du domaine User
 * Il orchestre le repository et implémente les règles métier
 */

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Trouve un utilisateur par email
   * @param email - L'email de l'utilisateur
   * @returns L'utilisateur ou null si non trouvé
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Trouve un utilisateur par email avec son abonnement actif
   * @param email - L'email de l'utilisateur
   * @returns L'utilisateur avec ses informations d'abonnement ou null
   */
  async findByEmailWithSubscription(
    email: string,
  ): Promise<UserWithSubscription | null> {
    return this.userRepository.findByEmailWithSubscription(email);
  }

  /**
   * Crée un nouvel utilisateur avec son abonnement
   * @param data - Les données de l'utilisateur à créer
   * @returns L'utilisateur créé avec son type d'abonnement
   */
  async createUser(data: CreateUserData): Promise<UserWithSubscription> {
    // 🤓 Validation: Vérifier que l'email n'existe pas déjà
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    return this.userRepository.create(data);
  }

  /**
   * Trouve un utilisateur par ID
   * @param id - L'ID de l'utilisateur
   * @returns L'utilisateur ou null si non trouvé
   */
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Trouve un utilisateur par ID avec son abonnement actif
   * @param id - L'ID de l'utilisateur
   * @returns L'utilisateur avec ses informations d'abonnement ou null
   */
  async findByIdWithSubscription(
    id: number,
  ): Promise<UserWithSubscription | null> {
    return this.userRepository.findByIdWithSubscription(id);
  }

  /**
   * Désactive l'abonnement actif d'un utilisateur
   * @param userId - L'ID de l'utilisateur
   */
  async deactivateActiveSubscription(userId: number): Promise<void> {
    return this.userRepository.deactivateActiveSubscription(userId);
  }
}
