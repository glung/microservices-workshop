import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../../repositories/UserRepository";
import {
  AuthService,
  LoginData,
  RegisterData,
} from "../../../services/AuthService";
import { SubscriptionKind } from "../../../types/models";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  const TEST_JWT_SECRET = "test_jwt_secret";

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;

    // 📣 Mock du UserRepository pour isoler les tests
    mockUserRepository = {
      create: jest.fn(),
      findByEmailWithSubscription: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdWithSubscription: jest.fn(),
      deactivateActiveSubscription: jest.fn(),
    } as any;

    authService = new AuthService(mockUserRepository);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe("register", () => {
    // 👩‍🎓 TODO: Implémenter ce test
    // Test 1: Enregistrer un utilisateur avec un abonnement Free
    it.todo("should register a user with Free subscription");

    // 👩‍🎓 TODO: Implémenter ce test
    // Test 2: Enregistrer un utilisateur avec un abonnement Max et définir la date de fin
    it.todo("should register a user with Max subscription and set end date");
  });

  describe("login", () => {
    // 👩‍🎓 TODO: Implémenter ce test
    // Test 3: Se connecter avec des identifiants valides
    it.todo("should login successfully with valid credentials");

    // 👩‍🎓 TODO: Implémenter ce test
    // Test 4: Échouer la connexion avec un mot de passe invalide
    it.todo("should fail login with invalid password");
  });
});
