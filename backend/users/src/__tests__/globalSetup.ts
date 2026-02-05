import { Pool } from "pg";

export default async () => {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://courseuser:coursepass@localhost:5432/usersdb";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

  const TEST_DATABASE_URL = process.env.DATABASE_URL.replace(
    "usersdb",
    "usersdb_test",
  );

  const adminPool = new Pool({
    connectionString: process.env.DATABASE_URL.replace("usersdb", "postgres"),
  });

  try {
    await adminPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'usersdb_test'
        AND pid <> pg_backend_pid()
    `);

    await adminPool.query("DROP DATABASE IF EXISTS usersdb_test");
    await adminPool.query("CREATE DATABASE usersdb_test");
  } catch (err) {
    // Ignore errors during setup.
  } finally {
    await adminPool.end();
  }

  const testPool = new Pool({
    connectionString: TEST_DATABASE_URL,
  });

  try {
    // Create enum type
    await testPool.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_kind AS ENUM ('Free', 'Max');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create subscriptions table
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind subscription_kind DEFAULT 'Free',
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        active BOOLEAN DEFAULT true,
        UNIQUE(user_id, active)
      )
    `);
  } finally {
    await testPool.end();
  }
};
