import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { users, challenges, submissions, userCategoryStats } from "./schema";
import { z } from "zod";

// --- Users ---
export const selectUserSchema = createSelectSchema(users);
// Omit generated/internal fields when inserting
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email(),
  username: (schema) => schema.min(3).max(20),
}).omit({ id: true, createdAt: true, currentRating: true, streakCount: true, lastActivityDate: true });


// --- Challenges ---
export const selectChallengeSchema = createSelectSchema(challenges);
export const insertChallengeSchema = createInsertSchema(challenges).omit({ 
  id: true, 
  createdAt: true 
});


// --- Submissions ---
// Extend the select schema to properly type the JSONB objects
export const selectSubmissionSchema = createSelectSchema(submissions, {
  proposedFix: z.object({ diff: z.string() }).optional(),
});

export const insertSubmissionSchema = createInsertSchema(submissions, {
  // Validate business rules when submitting
  hintsUsed: (schema) => schema.min(0),
  timeSpentSeconds: (schema) => schema.min(1),
}).omit({
  id: true,
  createdAt: true,
  fixCorrect: true, // Server determines this
  rootCauseScore: true, // LLM determines this
  totalScore: true,
  rootCauseEmbedding: true,
});


// --- Analytics ---
export const selectUserCategoryStatsSchema = createSelectSchema(userCategoryStats);
