import { Pool } from "pg";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://courseuser:coursepass@localhost:5432/coursedb_test";

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
    connectionString: TEST_DATABASE_URL.replace("coursedb_test", "postgres"),
  });

  try {
    if (poolInstance) {
      await poolInstance.end();
      poolInstance = null;
    }

    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'coursedb_test'
        AND pid <> pg_backend_pid()
    `);

    await adminPool.query("DROP DATABASE IF EXISTS coursedb_test");
    await adminPool.query("CREATE DATABASE coursedb_test");
  } catch (err) {
    // Ignore errors during setup.
  } finally {
    await adminPool.end();
  }
};

export const initTestSchema = async (): Promise<void> => {
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await testPool.query(`
    DO $$ BEGIN
      CREATE TYPE subscription_kind AS ENUM ('Free', 'Max');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      kind subscription_kind NOT NULL DEFAULT 'Free',
      start_date TIMESTAMP NOT NULL DEFAULT NOW(),
      end_date TIMESTAMP,
      active BOOLEAN DEFAULT true,
      UNIQUE(user_id, active)
    )
  `);

  await testPool.query(`
    DO $$ BEGIN
      CREATE TYPE course_kind AS ENUM ('Free', 'Max');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      kind course_kind NOT NULL DEFAULT 'Free',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await testPool.query(`
    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, course_id)
    )
  `);
};

export const cleanTestData = async (): Promise<void> => {
  await testPool.query("TRUNCATE likes CASCADE");
  await testPool.query("TRUNCATE courses RESTART IDENTITY CASCADE");
  await testPool.query("TRUNCATE subscriptions CASCADE");
  await testPool.query("TRUNCATE users RESTART IDENTITY CASCADE");
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
