import { pgRole, pgSchema } from "drizzle-orm/pg-core";

// --- Roles ---
export const adminRole = pgRole("admin").existing();
export const userRole = pgRole("user").existing();

// --- Schemas ---
export const analyticsSchema = pgSchema("analytics");

// --- Constants ---
export const EMBEDDING_DIM = 1536;
