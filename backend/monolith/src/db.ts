import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initDB = async (): Promise<void> => {
  try {
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
