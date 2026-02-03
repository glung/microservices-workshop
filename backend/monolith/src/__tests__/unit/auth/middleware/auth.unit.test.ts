import { Request, Response, NextFunction } from 'express';

// 📣 Mock du AuthService avant d'importer le middleware
const mockAuthenticateUserById = jest.fn();

jest.mock('../../../../auth/services/AuthService', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => {
      return {
        authenticateUserById: mockAuthenticateUserById,
      };
    }),
  };
});

import { authenticate, optionalAuth } from '../../../../auth/middleware/auth';

describe('authenticate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('when valid X-User-ID is provided', () => {
    it('should attach user to request and call next', async () => {
      const userId = 1;

      mockReq.headers = {
        'x-user-id': '1'
      };

      mockAuthenticateUserById.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        subscription_kind: 'Free',
        end_date: null
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthenticateUserById).toHaveBeenCalledWith(userId);
      expect(mockReq.user).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        subscription_kind: 'Free',
        end_date: null
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('when X-User-ID header is missing', () => {
    it('should return 401 error', async () => {
      mockReq.headers = {};

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when X-User-ID is invalid', () => {
    it('should return 401 error', async () => {
      mockReq.headers = {
        'x-user-id': 'invalid'
      };

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid user ID'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user not found in database', () => {
    it('should return 401 error', async () => {
      mockReq.headers = {
        'x-user-id': '999'
      };

      mockAuthenticateUserById.mockResolvedValue(null);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });
  });

  describe('when Max subscription is expired', () => {
    it('should downgrade to Free subscription (handled by AuthService)', async () => {
      const userId = 1;

      mockReq.headers = {
        'x-user-id': '1'
      };

      // 📣 Le AuthService gère maintenant l'expiration et retourne Free
      mockAuthenticateUserById.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        subscription_kind: 'Free',
        end_date: null
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockAuthenticateUserById).toHaveBeenCalledWith(userId);
      expect(mockReq.user?.subscription_kind).toBe('Free');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('optionalAuth middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next without attaching user when no X-User-ID header', async () => {
    await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should attach user when valid X-User-ID provided', async () => {
    const userId = 1;

    mockReq.headers = {
      'x-user-id': '1'
    };

    mockAuthenticateUserById.mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      subscription_kind: 'Max',
      end_date: null
    });

    await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.subscription_kind).toBe('Max');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next without user when X-User-ID is invalid', async () => {
    mockReq.headers = {
      'x-user-id': 'invalid'
    };

    await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
