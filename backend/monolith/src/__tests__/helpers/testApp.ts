import express from 'express';
import jwt from 'jsonwebtoken';

// Mock metrics before importing routes
jest.mock('../../monitoring/metrics', () => ({
  register: {
    contentType: 'text/plain',
    metrics: jest.fn().mockResolvedValue('mocked metrics')
  },
  httpRequestDuration: { observe: jest.fn() },
  httpRequestTotal: { inc: jest.fn() },
  httpRequestsInProgress: { inc: jest.fn(), dec: jest.fn() },
  dbQueryDuration: { observe: jest.fn() },
  dbConnectionsActive: { set: jest.fn() },
  dbQueriesTotal: { inc: jest.fn() },
  userRegistrations: { inc: jest.fn() },
  userLogins: { inc: jest.fn() },
  authenticationAttempts: { inc: jest.fn() },
  catalogViews: { inc: jest.fn() },
  courseViews: { inc: jest.fn() },
  courseLikes: { inc: jest.fn() },
  subscriptionUpgrades: { inc: jest.fn() },
  errorTotal: { inc: jest.fn() }
}));

// Mock db to use test pool
jest.mock('../../db', () => {
  const { testPool } = require('./testDb');
  return {
    pool: testPool,
    initDB: jest.fn().mockResolvedValue(undefined)
  };
});

import catalogRoutes from '../../courses/routes/catalog';
import coursesRoutes from '../../courses/routes/courses';
import accountsRoutes from '../../accounts/routes/accounts';

export const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // In e2e/unit HTTP tests we call the monolith directly (no gateway).
  // Translate Authorization: Bearer <jwt> into x-user-id like the gateway would.
  app.use((req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      next();
      return;
    }

    try {
      const secret = process.env.JWT_SECRET || 'test_secret';
      const decoded = jwt.verify(token, secret) as { userId: number };
      req.headers['x-user-id'] = decoded.userId.toString();
    } catch {
      // ignore invalid tokens; routes will handle auth failures
    }

    next();
  });

  app.use('/api/catalog', catalogRoutes);
  app.use('/api/courses', coursesRoutes);
  app.use('/api/accounts', accountsRoutes);

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'monolith' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', 'text/plain');
    res.end('mocked metrics');
  });

  return app;
};
