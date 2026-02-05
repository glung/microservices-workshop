module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/monitoring/metrics.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  globalTeardown: '<rootDir>/src/__tests__/teardown.ts',
  forceExit: true
};
