import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { adminRole, userRole } from "@/db/schema/roles";

// --- categories ---
export const categories = pgTable(
  "categories",
  {
    color: text("color"),
    description: text("description"),
    icon: text("icon"),
    id: uuid("id").primaryKey().defaultRandom(),
    isActive: boolean("is_active").notNull().default(true),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (_t) => [
    pgPolicy("admin_all_categories", {
      for: "all",
      to: adminRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    pgPolicy("user_read_categories", {
      for: "select",
      to: userRole,
      using: sql`true`,
    }),
  ]
);
