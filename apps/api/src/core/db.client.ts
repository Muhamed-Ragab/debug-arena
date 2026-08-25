/**
 * Single import point for the database inside apps/api. Features must import
 * `db`/`schema` from here instead of `@debug-arena/db` directly, so swapping
 * drivers or adding instrumentation touches one file.
 */
export { db, schema } from "@debug-arena/db";
