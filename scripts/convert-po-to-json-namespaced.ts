import fs from "node:fs";
import path from "node:path";

const PO_EN = "src/locales/en/messages.po";
const PO_AR = "src/locales/ar/messages.po";
const MAP_PATH = "scripts/po-key-map.json";
const OUT_BASE = "messages";

type PoEntry = { msgid: string; msgstr: string; refs: string[] };

function parsePo(filePath: string): PoEntry[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const blocks = raw.split("\n\n");
  const entries: PoEntry[] = [];
  for (const block of blocks) {
    const msgidMatch = block.match(/msgid "((?:[^"\\]|\\.)*)"/);
    if (!msgidMatch) continue;
    const msgid = msgidMatch[1];
    if (msgid === "") continue;
    // msgstr may be multiline: msgstr ""\n"line1"\n"line2" or simple msgstr "value"
    // For simplicity, extract msgstr value: join all msgstr lines
    const msgstrLines = [...block.matchAll(/msgstr "(.*)"/g)].map((m) => m[1]);
    // Handle multiline where msgstr "" then next lines are "...."
    // The above regex already captures; but for empty header, we need to handle quoted continuations
    // Actually PO with msgstr "" followed by "foo" lines: need to handle
    let msgstr = msgstrLines.join("");
    // Alternative: if msgstr is empty string and block contains continuation strings after msgstr
    if (msgstr === "" && block.includes('msgstr ""')) {
      const continuation = [...block.matchAll(/^"(.*)"/gm)].map((m) => m[1]);
      // first continuation after msgid is msgid continuation, second set is msgstr
      // Simpler: extract all quoted strings after msgstr
      const afterMsgstr = block.split("msgstr")[1] ?? "";
      const quotes = [...afterMsgstr.matchAll(/"(.*)"/g)].map((m) => m[1]);
      // first quote is msgstr value (empty), rest are continuations
      if (quotes.length > 1) {
        msgstr = quotes.slice(1).join("");
      }
      // If still empty, it means no translation
    }
    // Unescape
    msgid.replace(/\\"/g, '"').replace(/\\n/g, "\n");
    msgstr = msgstr.replace(/\\"/g, '"').replace(/\\n/g, "\n");
    const refs = [...block.matchAll(/#: (.*)/g)].map((m) => m[1].trim());
    entries.push({ msgid: msgid.replace(/\\"/g, '"'), msgstr: msgstr.replace(/\\"/g, '"'), refs });
  }
  return entries;
}

function slugify(msgid: string): string {
  // keep placeholders {xxx} as part of key? We'll strip and use generic
  // Remove ICU placeholders for slug
  let s = msgid.replace(/\{[^}]+\}/g, "").trim();
  s = s.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  s = s.split(/\s+/).slice(0, 6).join(" ");
  s = s.toLowerCase().replace(/\s+/g, "_");
  if (!s) s = "unnamed";
  return s.slice(0, 40);
}

function inferNamespace(entry: PoEntry): string {
  const refs = entry.refs.join(" ");
  if (refs.includes("src/features/landing")) return "landing";
  if (refs.includes("src/features/auth")) return "auth";
  if (refs.includes("src/features/challenge")) return "challenge";
  if (refs.includes("src/features/browser")) return "browser";
  if (refs.includes("src/features/admin")) return "admin";
  if (refs.includes("src/features/profile")) return "profile";
  if (refs.includes("src/features/results")) return "results";
  if (refs.includes("src/features/leaderboard")) return "leaderboard";
  if (refs.includes("src/features/category")) return "category";
  if (entry.msgid.includes("Error ID") || entry.msgid.includes("Something went wrong") || entry.msgid.includes("Service temporarily") || entry.msgid.includes("Unauthorized") || entry.msgid.includes("Forbidden") || entry.msgid.includes("Challenge not found") || entry.msgid.includes("User not found"))
    return "error";
  if (["Easy","Medium","Hard","Expert"].includes(entry.msgid)) return "difficulty";
  if (["Published","Draft","Archived"].includes(entry.msgid)) return "status";
  if (refs.includes("src/lib/i18n/seeds.ts") && !refs.includes("src/features")) {
    // infer from content
    if (["Backend Concurrency","Logic Inversions","Memory Leaks","Off-by-One","Race Conditions","React Rendering","Security Flaws","State Mutations"].includes(entry.msgid)) return "category";
    if (entry.msgid.startsWith("Root cause") || entry.msgid.startsWith("Prompt must") || entry.msgid.startsWith("Title must") || entry.msgid.startsWith("Instruction is required") || entry.msgid.startsWith("Invalid hex") || entry.msgid.startsWith("Slug must") || entry.msgid.startsWith("Username can") || entry.msgid.startsWith("Invalid email")) return "validation";
  }
  return "common";
}

function deepSet(obj: Record<string, unknown>, pathStr: string, value: string) {
  const parts = pathStr.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

const mapRaw = JSON.parse(fs.readFileSync(MAP_PATH, "utf-8")) as Record<string, string>;
const enEntries = parsePo(PO_EN);
const arEntries = parsePo(PO_AR);
const arMap = new Map(arEntries.map((e) => [e.msgid, e.msgstr]));

console.log(`EN entries: ${enEntries.length}, AR entries: ${arEntries.length}, map size: ${Object.keys(mapRaw).length}`);

let missingInMap = 0;
const allSemanticKeys = new Set<string>();

// Prepare namespaces containers
const namespaces = new Set<string>();
for (const v of Object.values(mapRaw)) {
  namespaces.add(v.split(".")[0]);
}
// add inferred namespaces
for (const e of enEntries) {
  const key = mapRaw[e.msgid];
  if (!key) {
    const ns = inferNamespace(e);
    namespaces.add(ns);
  }
}
console.log("Namespaces detected:", [...namespaces].join(", "));

const enOut: Record<string, Record<string, unknown>> = {};
const arOut: Record<string, Record<string, unknown>> = {};
for (const ns of namespaces) {
  enOut[ns] = {};
  arOut[ns] = {};
}

for (const entry of enEntries) {
  let semantic = mapRaw[entry.msgid];
  if (!semantic) {
    missingInMap++;
    const ns = inferNamespace(entry);
    const slug = slugify(entry.msgid);
    semantic = `${ns}.${slug}`;
    // ensure uniqueness
    let candidate = semantic;
    let counter = 1;
    while (allSemanticKeys.has(candidate)) {
      candidate = `${semantic}_${counter++}`;
    }
    semantic = candidate;
    console.log(`Missing map for "${entry.msgid}" -> ${semantic} (refs: ${entry.refs.join(",")})`);
  }
  allSemanticKeys.add(semantic);
  const [ns, ...rest] = semantic.split(".");
  const leafPath = rest.join(".");
  // For namespaces like difficulty/status, we want flat key under that namespace? Our map uses difficulty.easy -> ns=difficulty leaf=easy
  // For landing.features.realBugClasses.title -> ns=landing leaf=features.realBugClasses.title
  // So we deepSet under enOut[ns] with leafPath
  const enNamespaces = enOut[ns];
  const arNamespaces = arOut[ns];
  if (!enNamespaces) {
    // create if not exist (should not happen)
    enOut[ns] = {};
    arOut[ns] = {};
  }
  deepSet(enOut[ns]!, leafPath, entry.msgid);
  const arVal = arMap.get(entry.msgid);
  if (arVal && arVal.trim() !== "") {
    deepSet(arOut[ns]!, leafPath, arVal);
  } else {
    // fallback copy en + TODO comment? For JSON we just copy en
    deepSet(arOut[ns]!, leafPath, entry.msgid);
  }
}

console.log(`Missing in map: ${missingInMap}`);
console.log(`Total semantic keys: ${allSemanticKeys.size}`);

// Verify no collision and counts
const totalEnKeys = enEntries.length;
if (allSemanticKeys.size !== totalEnKeys) {
  console.error(`Mismatch: enEntries ${totalEnKeys} vs semantic ${allSemanticKeys.size}`);
  // Not fatal, but warn
}

// Write output
for (const ns of namespaces) {
  const enPath = path.join(OUT_BASE, "en", `${ns}.json`);
  const arPath = path.join(OUT_BASE, "ar", `${ns}.json`);
  ensureDir(path.dirname(enPath));
  ensureDir(path.dirname(arPath));
  fs.writeFileSync(enPath, JSON.stringify(enOut[ns], null, 2) + "\n", "utf-8");
  fs.writeFileSync(arPath, JSON.stringify(arOut[ns], null, 2) + "\n", "utf-8");
  console.log(`Wrote ${enPath} (${Object.keys(flatten(enOut[ns]!)).length} leafs)`);
  console.log(`Wrote ${arPath}`);
}

// Helper to flatten for count
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const res: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(res, flatten(v as Record<string, unknown>, newKey));
    } else {
      res[newKey] = v as string;
    }
  }
  return res;
}

// Also write combined aggregated file for debugging
fs.writeFileSync(path.join(OUT_BASE, "en.json"), JSON.stringify(enOut, null, 2));
fs.writeFileSync(path.join(OUT_BASE, "ar.json"), JSON.stringify(arOut, null, 2));

// Write updated po-key-map for missing entries
const fullMap: Record<string, string> = { ...mapRaw };
for (const entry of enEntries) {
  if (!fullMap[entry.msgid]) {
    // find generated key
    // We need to reverse lookup from enOut
    // Find where entry.msgid was placed
    for (const [ns, obj] of Object.entries(enOut)) {
      const flat = flatten(obj as Record<string, unknown>);
      for (const [k, v] of Object.entries(flat)) {
        if (v === entry.msgid) {
          const fullKey = `${ns}.${k}`;
          if (!fullMap[entry.msgid]) fullMap[entry.msgid] = fullKey;
        }
      }
    }
  }
}
fs.writeFileSync(MAP_PATH, JSON.stringify(fullMap, null, 2) + "\n");
console.log(`Updated ${MAP_PATH} to ${Object.keys(fullMap).length} entries`);

// Verification as per plan: Object.keys(po).length === sum(Object.values(enNamespaces).flatKeys)
const sumKeys = Object.values(enOut).reduce((acc, nsObj) => acc + Object.keys(flatten(nsObj as Record<string, unknown>)).length, 0);
console.log(`Verification: poKeys=${enEntries.length}, sumKeys=${sumKeys}, match=${enEntries.length===sumKeys}`);
if (enEntries.length !== sumKeys) process.exit(1);
