import { config } from "dotenv";

// App dir first (local override), then repo root (shared defaults).
// Must be imported before anything reads process.env (auth, pg Pool).
config({ path: ".env" });
config({ path: "../../.env" });
