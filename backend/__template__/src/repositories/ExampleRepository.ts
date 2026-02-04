import { pool } from "../db";

export interface ExampleRecord {
  id: number;
  name: string;
  created_at: Date;
}

export class ExampleRepository {
  async listAll(): Promise<ExampleRecord[]> {
    const result = await pool.query<ExampleRecord>(
      "SELECT id, name, created_at FROM examples ORDER BY id ASC",
    );
    return result.rows;
  }

  async findById(id: number): Promise<ExampleRecord | null> {
    const result = await pool.query<ExampleRecord>(
      "SELECT id, name, created_at FROM examples WHERE id = $1",
      [id],
    );
    return result.rows[0] || null;
  }

  async create(name: string): Promise<ExampleRecord> {
    const result = await pool.query<ExampleRecord>(
      "INSERT INTO examples (name) VALUES ($1) RETURNING id, name, created_at",
      [name],
    );
    return result.rows[0];
  }
}
