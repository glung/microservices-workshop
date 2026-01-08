import express from 'express';

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

import authRoutes from '../../routes/auth';
import catalogRoutes from '../../routes/catalog';
import coursesRoutes from '../../routes/courses';
import accountsRoutes from '../../routes/accounts';

export const createTestApp = () => {
  const app = express();
  app.use(express.json());

  app.use('/api/auth', authRoutes);
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
