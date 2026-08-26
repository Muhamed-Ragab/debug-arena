import { eq } from "drizzle-orm";
import "@/lib/env";
import {
  SEED_CATEGORIES,
  SEED_CHALLENGES,
} from "@/features/challenge/data/challenges.seed";
import { generateDeterministicEmbedding } from "@/features/challenge/lib/embedding";
import { db } from "./client";
import * as schema from "./schema";

async function main() {
  console.log("🌱 Seeding database with categories and challenges...");

  // 1. Seed Categories
  const categoryMap = new Map<string, string>();

  for (const cat of SEED_CATEGORIES) {
    // biome-ignore lint/performance/noAwaitInLoops: sequential category lookup
    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      categoryMap.set(cat.slug, existing[0].id);
      console.log(`  ✓ Category "${cat.name}" exists (${existing[0].id})`);
    } else {
      const [inserted] = await db
        .insert(schema.categories)
        .values({
          description: cat.description,
          name: cat.name,
          slug: cat.slug,
        })
        .returning();
      categoryMap.set(cat.slug, inserted.id);
      console.log(`  + Inserted category "${cat.name}" (${inserted.id})`);
    }
  }

  // 2. Seed Challenges and Hints
  for (const ch of SEED_CHALLENGES) {
    const categoryId = categoryMap.get(ch.categorySlug);
    if (!categoryId) {
      console.warn(`  ! Category not found for slug: ${ch.categorySlug}`);
      continue;
    }

    const embedding = generateDeterministicEmbedding(ch.rootCauseSummary);

    // biome-ignore lint/performance/noAwaitInLoops: sequential challenge lookup
    const existing = await db
      .select()
      .from(schema.challenges)
      .where(eq(schema.challenges.title, ch.title))
      .limit(1);

    let challengeId: string;

    if (existing.length > 0) {
      challengeId = existing[0].id;
      await db
        .update(schema.challenges)
        .set({
          buggyArtifact: ch.buggyArtifact,
          categoryId,
          difficulty: ch.difficulty,
          format: ch.format,
          preventionNotes: ch.preventionNotes,
          prompt: ch.prompt,
          referenceFix: ch.referenceFix,
          rootCauseEmbedding: embedding,
          rootCauseSummary: ch.rootCauseSummary,
          source: ch.source,
          status: ch.status,
        })
        .where(eq(schema.challenges.id, challengeId));
      console.log(`  ✓ Updated challenge "${ch.title}" (${challengeId})`);
    } else {
      const [inserted] = await db
        .insert(schema.challenges)
        .values({
          buggyArtifact: ch.buggyArtifact,
          categoryId,
          difficulty: ch.difficulty,
          format: ch.format,
          preventionNotes: ch.preventionNotes,
          prompt: ch.prompt,
          referenceFix: ch.referenceFix,
          rootCauseEmbedding: embedding,
          rootCauseSummary: ch.rootCauseSummary,
          source: ch.source,
          status: ch.status,
          title: ch.title,
        })
        .returning();
      challengeId = inserted.id;
      console.log(`  + Inserted challenge "${ch.title}" (${challengeId})`);
    }

    // Clean and insert hints
    await db
      .delete(schema.hints)
      .where(eq(schema.hints.challengeId, challengeId));

    if (ch.hints.length > 0) {
      await db.insert(schema.hints).values(
        ch.hints.map((hint) => ({
          challengeId,
          order: hint.order,
          penaltyPoints: hint.penaltyPoints,
          socraticPrompt: hint.socraticPrompt,
        }))
      );
    }
  }

  console.log("✅ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
