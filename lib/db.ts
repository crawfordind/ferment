import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { getEnv } from "@/lib/env";
import * as schema from "@/lib/schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    const env = getEnv();
    const client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
    db = drizzle(client, { schema });
  }

  return db;
}

export type Database = ReturnType<typeof getDb>;
