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
    it("should register a user with Free subscription", async () => {
      const registerData: RegisterData = {
        email: "john@example.com",
        password: "secret123",
        name: "John Doe",
      };

      const createdUser = {
        id: 1,
        email: "john@example.com",
        name: "John Doe",
        password: "hashed_password",
        subscription_kind: "Free" as SubscriptionKind,
        end_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await authService.register(registerData);

      // Vérifications
      expect(result.user.email).toBe("john@example.com");
      expect(result.user.name).toBe("John Doe");
      expect(result.user.subscription_kind).toBe("Free");
      expect(result.token).toBeDefined();

      // Vérifier que le mot de passe a été hashé
      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe("secret123");
    });

    it("should register a user with Max subscription and set end date", async () => {
      const registerData: RegisterData = {
        email: "jane@example.com",
        password: "secret456",
        name: "Jane Smith",
        subscriptionKind: "Max",
      };

      const createdUser = {
        id: 2,
        email: "jane@example.com",
        name: "Jane Smith",
        password: "hashed_password",
        subscription_kind: "Max" as SubscriptionKind,
        end_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await authService.register(registerData);

      // Vérifications
      expect(result.user.subscription_kind).toBe("Max");
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const loginData: LoginData = {
        email: "john@example.com",
        password: "secret123",
      };

      const hashedPassword = await bcrypt.hash("secret123", 10);

      const existingUser = {
        id: 1,
        email: "john@example.com",
        name: "John Doe",
        password: hashedPassword,
        subscription_kind: "Free" as SubscriptionKind,
        end_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmailWithSubscription.mockResolvedValue(
        existingUser,
      );

      const result = await authService.login(loginData);

      // Vérifications
      expect(result.user.email).toBe("john@example.com");
      expect(result.user.name).toBe("John Doe");
      expect(result.token).toBeDefined();

      const decoded = jwt.verify(result.token, TEST_JWT_SECRET) as any;
      expect(decoded.userId).toBe(1);
    });

    it("should fail login with invalid password", async () => {
      const loginData: LoginData = {
        email: "john@example.com",
        password: "wrong_password",
      };

      // Hash d'un mot de passe différent
      const hashedPassword = await bcrypt.hash("secret123", 10);

      const existingUser = {
        id: 1,
        email: "john@example.com",
        name: "John Doe",
        password: hashedPassword,
        subscription_kind: "Free" as SubscriptionKind,
        end_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmailWithSubscription.mockResolvedValue(
        existingUser,
      );

      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });
});
