import { Pool } from "pg";

export default async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://courseuser:coursepass@localhost:5432/coursedb_test";

  const adminPool = new Pool({
    connectionString: process.env.DATABASE_URL.replace("coursedb_test", "postgres"),
  });

  try {
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'coursedb_test'
        AND pid <> pg_backend_pid()
    `);

    await adminPool.query("DROP DATABASE IF EXISTS coursedb_test");
    await adminPool.query("CREATE DATABASE coursedb_test");
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    const error = new Error(
      `Failed to prepare test database. Is Postgres reachable? ${details}`,
    ) as Error & { cause?: unknown };
    error.cause = err;
    throw error;
  } finally {
    await adminPool.end();
  }

  const testPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
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
  } finally {
    await testPool.end();
  }
};
