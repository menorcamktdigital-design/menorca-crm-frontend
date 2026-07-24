import { Pool } from "pg";

declare global {
  var __dbPool: Pool | undefined;
}

export const pool = (globalThis.__dbPool ??= new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 5,
}));

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    return (await client.query(sql, params)).rows as T[];
  } finally {
    client.release();
  }
}
