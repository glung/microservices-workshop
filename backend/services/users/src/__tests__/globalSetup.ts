import { Pool } from "pg";

export default async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://courseuser:coursepass@localhost:5432/coursedb";

  const TEST_DATABASE_URL = process.env.DATABASE_URL.replace("coursedb", "coursedb_test");

  const adminPool = new Pool({
    connectionString: process.env.DATABASE_URL.replace("coursedb", "postgres"),
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
    // Ignore errors during setup.
  } finally {
    await adminPool.end();
  }

  const testPool = new Pool({
    connectionString: TEST_DATABASE_URL,
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
  } finally {
    await testPool.end();
  }
};

