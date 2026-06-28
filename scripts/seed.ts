import "dotenv/config";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { SEED_TEMPLATES } from "@/lib/seed-data";
import { templateStages, templates } from "@/lib/schema";

async function seed() {
  const db = getDb();

  console.log("Seeding templates and stages...");

  for (const template of SEED_TEMPLATES) {
    await db
      .insert(templates)
      .values({
        id: template.id,
        type: template.type,
        category: template.category,
        name: template.name,
        defaultUnit: template.defaultUnit,
      })
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          type: template.type,
          category: template.category,
          name: template.name,
          defaultUnit: template.defaultUnit,
        },
      });

    for (const stage of template.stages) {
      await db
        .insert(templateStages)
        .values({
          id: stage.id,
          templateId: template.id,
          stageIndex: stage.stageIndex,
          name: stage.name,
          dayStart: stage.dayStart,
          dayEnd: stage.dayEnd,
          expectationText: stage.expectationText,
          actionLabel: stage.actionLabel,
        })
        .onConflictDoUpdate({
          target: templateStages.id,
          set: {
            templateId: template.id,
            stageIndex: stage.stageIndex,
            name: stage.name,
            dayStart: stage.dayStart,
            dayEnd: stage.dayEnd,
            expectationText: stage.expectationText,
            actionLabel: stage.actionLabel,
          },
        });
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(templates);

  console.log(`Seed complete. ${count} template(s) in database.`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
