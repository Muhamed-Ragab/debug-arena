import { config } from "dotenv";

// Package/app dir first (local override), then repo root (shared defaults).
// Must be imported before anything reads process.env (pg Pool creation).
config({ path: ".env" });
config({ path: "../../.env" });
