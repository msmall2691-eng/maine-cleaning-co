import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. Database features will not work.");
}

export const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : (null as unknown as pg.Pool);

export const db = process.env.DATABASE_URL
  ? drizzle(pool, { schema })
  : (null as unknown as ReturnType<typeof drizzle>);
