import { UserService } from "../../../services/UserService";
import { UserRepository } from "../../../repositories/UserRepository";

// Mock JWT_SECRET
process.env.JWT_SECRET = "test-secret-key";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn().mockImplementation((password, hash) => {
    return Promise.resolve(password === "correct_password");
  }),
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("mock_token"),
  verify: jest.fn().mockImplementation((token) => {
    if (token === "valid_token") {
      return { userId: 1 };
    }
    throw new Error("Invalid token");
  }),
}));

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findByEmailWithSubscription: jest.fn(),
      findById: jest.fn(),
      findByIdWithSubscription: jest.fn(),
      create: jest.fn(),
      listAll: jest.fn(),
      deactivateActiveSubscription: jest.fn(),
      upgradeSubscription: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    userService = new UserService(mockUserRepository);
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
        name: "Test User",
        created_at: new Date(),
        subscription_kind: "Free",
        end_date: null,
      });

      const result = await userService.register({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.user.name).toBe("Test User");
      expect(result.user.subscription_kind).toBe("Free");
      expect(result.token).toBe("mock_token");
    });

    it("should throw error if email already exists", async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "existing@example.com",
        password: "hashed",
        name: "Existing",
        created_at: new Date(),
      });

      await expect(
        userService.register({
          email: "existing@example.com",
          password: "password123",
          name: "Test User",
        })
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      mockUserRepository.findByEmailWithSubscription.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
        name: "Test User",
        created_at: new Date(),
        subscription_kind: "Free",
        end_date: null,
      });

      // Mock bcrypt.compare to return true for correct password
      const bcrypt = require("bcrypt");
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await userService.login({
        email: "test@example.com",
        password: "correct_password",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.token).toBe("mock_token");
    });

    it("should throw error for invalid credentials", async () => {
      mockUserRepository.findByEmailWithSubscription.mockResolvedValue(null);

      await expect(
        userService.login({
          email: "nonexistent@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("authenticateUserById", () => {
    it("should return user info for valid user", async () => {
      mockUserRepository.findByIdWithSubscription.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
        name: "Test User",
        created_at: new Date(),
        subscription_kind: "Free",
        end_date: null,
      });

      const result = await userService.authenticateUserById(1);

      expect(result?.id).toBe(1);
      expect(result?.email).toBe("test@example.com");
      expect(result?.subscription_kind).toBe("Free");
    });

    it("should return null for non-existent user", async () => {
      mockUserRepository.findByIdWithSubscription.mockResolvedValue(null);

      const result = await userService.authenticateUserById(999);

      expect(result).toBeNull();
    });

    it("should deactivate expired Max subscription", async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      mockUserRepository.findByIdWithSubscription.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
        name: "Test User",
        created_at: new Date(),
        subscription_kind: "Max",
        end_date: expiredDate,
      });

      const result = await userService.authenticateUserById(1);

      expect(mockUserRepository.deactivateActiveSubscription).toHaveBeenCalledWith(1);
      expect(result?.subscription_kind).toBe("Free");
    });
  });

  describe("verifyToken", () => {
    it("should return user for valid token", async () => {
      mockUserRepository.findByIdWithSubscription.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashed_password",
        name: "Test User",
        created_at: new Date(),
        subscription_kind: "Free",
        end_date: null,
      });

      const result = await userService.verifyToken("valid_token");

      expect(result?.id).toBe(1);
    });

    it("should return null for invalid token", async () => {
      const result = await userService.verifyToken("invalid_token");

      expect(result).toBeNull();
    });
  });
});
