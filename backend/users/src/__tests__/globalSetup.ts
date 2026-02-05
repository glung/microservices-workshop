import { Pool } from "pg";

export default async () => {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://courseuser:coursepass@localhost:5432/templatedb";

  const TEST_DATABASE_URL = process.env.DATABASE_URL.replace(
    "templatedb",
    "templatedb_test",
  );

  const adminPool = new Pool({
    connectionString: process.env.DATABASE_URL.replace("templatedb", "postgres"),
  });

  try {
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

  const testPool = new Pool({
    connectionString: TEST_DATABASE_URL,
  });

  try {
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS examples (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } finally {
    await testPool.end();
  }
};
