import { Pool } from "pg";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL?.replace("templatedb", "templatedb_test") ||
  "postgresql://courseuser:coursepass@localhost:5432/templatedb_test";

let poolInstance: Pool | null = null;

export const testPool = new Proxy({} as Pool, {
  get(_target, prop) {
    if (!poolInstance) {
      poolInstance = new Pool({
        connectionString: TEST_DATABASE_URL,
      });
    }
    return (poolInstance as any)[prop];
  },
});

export const createTestDatabase = async (): Promise<void> => {
  const adminPool = new Pool({
    connectionString:
      process.env.DATABASE_URL?.replace("templatedb", "postgres") ||
      "postgresql://courseuser:coursepass@localhost:5432/postgres",
  });

  try {
    if (poolInstance) {
      await poolInstance.end();
      poolInstance = null;
    }

    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'templatedb_test'
        AND pid <> pg_backend_pid()
    `);

    await adminPool.query("DROP DATABASE IF EXISTS templatedb_test");
    await adminPool.query("CREATE DATABASE templatedb_test");
  } catch (err) {
    // Ignore errors during setup.
  } finally {
    await adminPool.end();
  }
};

export const initTestSchema = async (): Promise<void> => {
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS examples (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export const cleanTestData = async (): Promise<void> => {
  await testPool.query("TRUNCATE examples RESTART IDENTITY CASCADE");
};

export const closeTestDatabase = async (): Promise<void> => {
  if (poolInstance) {
    try {
      await poolInstance.end();
    } catch (err) {
      // Ignore errors during cleanup.
    } finally {
      poolInstance = null;
    }
  }
};
