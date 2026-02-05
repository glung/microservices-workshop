import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async (): Promise<void> => {
  try {
    console.log("Template database initialized successfully");
  } catch (err) {
    console.error("Template database initialization error:", err);
  }
};

export { pool, initDB };
