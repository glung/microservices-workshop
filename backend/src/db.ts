import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initDB = async (): Promise<void> => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
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

    await pool.query(`
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      )
    `);

    await pool.query(`
      INSERT INTO courses (name, author, content, kind) VALUES
      ('Introduction to Programming', 'John Doe', 'Learn the basics of programming...', 'Free'),
      ('Advanced JavaScript', 'Jane Smith', 'Master JavaScript patterns and techniques...', 'Max'),
      ('Python for Beginners', 'Bob Wilson', 'Start your Python journey...', 'Free'),
      ('Machine Learning Fundamentals', 'Alice Brown', 'Deep dive into ML concepts...', 'Max'),
      ('Web Development Basics', 'Charlie Davis', 'HTML, CSS and JS foundations...', 'Free')
      ON CONFLICT DO NOTHING
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

export { pool, initDB };
