import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/schema";

export async function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  // Apply every migration in order so the test schema tracks the real one.
  const drizzleDir = join(process.cwd(), "drizzle");
  const migrationFiles = readdirSync(drizzleDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migrationSql = readFileSync(join(drizzleDir, file), "utf8");
    const statements = migrationSql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.execute(statement);
    }
  }

  await client.execute(`
    INSERT INTO templates (id, type, category, name, default_unit)
    VALUES ('tpl-fpj', 'fpj', 'fertilizer', 'FPJ', 'kg')
  `);

  return db;
}
