import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SubscriptionKind } from "@prisma/client";
import { UserRepository } from "../../../repositories/UserRepository";
import { AuthService, LoginData, RegisterData } from "../../../services/AuthService";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  const TEST_JWT_SECRET = "test_jwt_secret";

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;

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

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser as any);

      const result = await authService.register(registerData);

      expect(result.user.email).toBe("john@example.com");
      expect(result.user.name).toBe("John Doe");
      expect(result.user.subscription_kind).toBe("Free");
      expect(result.token).toBeDefined();

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

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser as any);

      const result = await authService.register(registerData);
      expect(result.user.subscription_kind).toBe("Max");
    });

    it("should fail when email already exists", async () => {
      const registerData: RegisterData = {
        email: "dup@example.com",
        password: "secret456",
        name: "Dup",
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 99,
      } as any);

      await expect(authService.register(registerData)).rejects.toThrow(
        "Email already exists",
      );
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
        existingUser as any,
      );

      const result = await authService.login(loginData);
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

      const hashedPassword = await bcrypt.hash("secret123", 10);
      mockUserRepository.findByEmailWithSubscription.mockResolvedValue({
        id: 1,
        email: "john@example.com",
        name: "John Doe",
        password: hashedPassword,
        subscription_kind: "Free" as SubscriptionKind,
        end_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials",
      );
    });

    it("should fail login when user does not exist", async () => {
      const loginData: LoginData = {
        email: "nonexistent@example.com",
        password: "secret123",
      };

      mockUserRepository.findByEmailWithSubscription.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });
});
