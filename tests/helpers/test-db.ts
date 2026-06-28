import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/schema";

export async function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  const migrationPath = join(
    process.cwd(),
    "drizzle",
    "0000_blushing_switch.sql",
  );
  const migrationSql = readFileSync(migrationPath, "utf8");
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }

  await client.execute(`
    INSERT INTO templates (id, type, category, name, default_unit)
    VALUES ('tpl-fpj', 'fpj', 'fertilizer', 'FPJ', 'kg')
  `);

  return db;
}
