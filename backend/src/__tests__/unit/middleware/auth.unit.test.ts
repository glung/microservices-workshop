import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth } from '../../../middleware/auth';

// Mock dependencies
jest.mock('../../../db', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../../monitoring/metrics', () => ({
  authenticationAttempts: { inc: jest.fn() },
  errorTotal: { inc: jest.fn() }
}));

import { pool } from '../../../db';
const mockPool = pool as jest.Mocked<typeof pool> & {
  query: jest.Mock;
};

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
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('when valid token is provided', () => {
    it('should attach user to request and call next', async () => {
      const userId = 1;
      const token = jwt.sign({ userId }, 'test_secret');

      mockReq.headers = {
        authorization: `Bearer ${token}`
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          subscription_kind: 'Free',
          end_date: null
        }],
        command: '',
        oid: 0,
        rowCount: 1,
        fields: []
      } as any);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*'),
        [userId]
      );
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

  describe('when token is missing', () => {
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

  describe('when token is invalid', () => {
    it('should return 401 error', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid_token'
      };

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when user not found in database', () => {
    it('should return 401 error', async () => {
      const userId = 999;
      const token = jwt.sign({ userId }, 'test_secret');

      mockReq.headers = {
        authorization: `Bearer ${token}`
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [],
        command: '',
        oid: 0,
        rowCount: 0,
        fields: []
      } as any);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });
  });

  describe('when Max subscription is expired', () => {
    it('should downgrade to Free subscription', async () => {
      const userId = 1;
      const token = jwt.sign({ userId }, 'test_secret');
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      mockReq.headers = {
        authorization: `Bearer ${token}`
      };

      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: userId,
            email: 'test@example.com',
            name: 'Test User',
            subscription_kind: 'Max',
            end_date: expiredDate
          }],
          command: '',
          oid: 0,
          rowCount: 1,
          fields: []
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          command: '',
          oid: 0,
          rowCount: 1,
          fields: []
        } as any);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE subscriptions'),
        [userId]
      );
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
    process.env.JWT_SECRET = 'test_secret';
  });

  it('should call next without attaching user when no token', async () => {
    await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should attach user when valid token provided', async () => {
    const userId = 1;
    const token = jwt.sign({ userId }, 'test_secret');

    mockReq.headers = {
      authorization: `Bearer ${token}`
    };

    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        subscription_kind: 'Max',
        end_date: null
      }],
      command: '',
      oid: 0,
      rowCount: 1,
      fields: []
    } as any);

    await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.subscription_kind).toBe('Max');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next without user when token is invalid', async () => {
    mockReq.headers = {
      authorization: 'Bearer invalid_token'
    };

    await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
