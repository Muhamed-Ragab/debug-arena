import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { SEED_CATEGORIES } from "@/features/category/constants";
import { SEED_CHALLENGES } from "@/features/challenge/data/challenges.seed";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env/env";
import { db } from "./client";
import * as schema from "./schema";
import { resolveAdminSeedPassword } from "./seed-utils";

async function seedAdmin() {
  const adminEmail = env.ADMIN_EMAIL ?? "admin@debugarena.dev";
  const adminPassword = resolveAdminSeedPassword(env.ADMIN_PASSWORD);
  const adminName = env.ADMIN_NAME ?? "Debug Arena Admin";

  if (!adminPassword) {
    console.warn(
      "Skipping optional admin seed; configure ADMIN_PASSWORD to create the admin account."
    );
    return;
  }

  console.log(`\n👤 Seeding admin account (${adminEmail})...`);

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, adminEmail),
  });

  if (existing) {
    if (existing.role !== "admin" || !existing.emailVerified) {
      await db
        .update(schema.users)
        .set({ emailVerified: true, role: "admin" })
        .where(eq(schema.users.id, existing.id));
      console.log(`  ✓ Updated existing user "${adminEmail}" to admin role`);
    } else {
      console.log(
        `  ✓ Admin user "${adminEmail}" already exists with admin role`
      );
    }
    return;
  }

  await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      name: adminName,
      password: adminPassword,
    },
  });

  await db
    .update(schema.users)
    .set({ emailVerified: true, role: "admin" })
    .where(eq(schema.users.email, adminEmail));

  console.log(`  + Created admin user "${adminEmail}" with role "admin"`);
}

async function main() {
  console.log("🌱 Seeding database with categories and challenges...");

  // 1. Seed Categories — idempotent upsert on slug
  const categorySeedData = SEED_CATEGORIES.map((cat) => ({
    color: cat.color,
    description: cat.description,
    icon: cat.icon,
    isActive: cat.isActive,
    name: cat.name,
    slug: cat.slug,
    sortOrder: cat.sortOrder,
  }));

  await db
    .insert(schema.categories)
    .values(categorySeedData)
    .onConflictDoUpdate({
      set: {
        color: sql`excluded.color`,
        description: sql`excluded.description`,
        icon: sql`excluded.icon`,
        isActive: sql`excluded.is_active`,
        name: sql`excluded.name`,
        sortOrder: sql`excluded.sort_order`,
      },
      target: schema.categories.slug,
    });

  const allCategories = await db.query.categories.findMany();
  const categoryMap = new Map<string, string>();
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
  }
  for (const cat of SEED_CATEGORIES) {
    const id = categoryMap.get(cat.slug);
    if (id) {
      console.log(`  ✓ Category "${cat.name}" upserted (${id})`);
    }
  }

  // 2. Seed Challenges and Hints
  for (const ch of SEED_CHALLENGES) {
    const categoryId = categoryMap.get(ch.categorySlug);
    if (!categoryId) {
      console.warn(`  ! Category not found for slug: ${ch.categorySlug}`);
      continue;
    }

    // biome-ignore lint/performance/noAwaitInLoops: sequential challenge lookup
    const existing = await db.query.challenges.findFirst({
      where: eq(schema.challenges.title, ch.title),
    });

    let challengeId: string;
    const buggyArtifact = {
      ...ch.buggyArtifact,
      ...(ch.hiddenTests ? { hiddenTests: ch.hiddenTests } : {}),
    };

    if (existing) {
      challengeId = existing.id;
      await db
        .update(schema.challenges)
        .set({
          buggyArtifact,
          categoryId,
          difficulty: ch.difficulty,
          format: ch.format,
          preventionNotes: ch.preventionNotes,
          prompt: ch.prompt,
          referenceFix: ch.referenceFix,
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
          buggyArtifact,
          categoryId,
          difficulty: ch.difficulty,
          format: ch.format,
          preventionNotes: ch.preventionNotes,
          prompt: ch.prompt,
          referenceFix: ch.referenceFix,
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

  // 3. Seed Admin User
  await seedAdmin();

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
