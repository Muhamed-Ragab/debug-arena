import fs from "node:fs";
import path from "node:path";
import { globSync } from "node:fs";

const MAP_PATH = "scripts/po-key-map.json";
const map: Record<string, string> = JSON.parse(fs.readFileSync(MAP_PATH, "utf-8"));

// Files to codemod (excluding seeds which will be deleted)
const patterns = [
  "src/app/**/*.tsx",
  "src/app/**/*.ts",
  "src/components/**/*.tsx",
  "src/features/**/*.tsx",
  "src/features/**/*.ts",
  "src/lib/**/*.ts",
];

function getFiles(): string[] {
  const all: string[] = [];
  for (const pat of patterns) {
    const base = pat.split("/**")[0];
    // use recursive read
    const files = fs.readdirSync(base, { recursive: true } as any) as string[];
    // fallback: use manual glob via Node 22? Instead use simple walk
  }
  return all;
}

function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx"))) {
      // filter by patterns above
      if (
        full.startsWith("src\\app") ||
        full.startsWith("src/app") ||
        full.startsWith("src\\components") ||
        full.startsWith("src/components") ||
        full.startsWith("src\\features") ||
        full.startsWith("src/features") ||
        full.startsWith("src\\lib") ||
        full.startsWith("src/lib")
      ) {
        // exclude seeds, i18n files handled separately, and test files? Keep tests for now but codemod?
        if (full.includes("\\test") || full.includes("/test") || full.includes(".test.")) continue;
        if (full.includes("src/locales")) continue;
        files.push(full);
      }
    }
  }
  return files;
}

const files = walk("src");
console.log(`Found ${files.length} files to check`);

let changedCount = 0;
let totalReplacements = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  const original = content;

  // Skip if no lingui
  if (!content.includes("lingui") && !content.includes("i18n._")) continue;

  // Determine if file already uses next-intl
  const hasNextIntl = content.includes("next-intl");

  // Replace imports
  // Remove "use client" lingui imports, replace with next-intl
  // Cases:
  // import { useLingui } from "@lingui/react";
  // import { i18n } from "@lingui/core";
  // import { I18nProvider } from "@lingui/react";

  // Replace useLingui import with useTranslations
  content = content.replace(/import\s*\{\s*useLingui\s*\}\s*from\s*["']@lingui\/react["'];?\n?/g, 'import { useTranslations } from "next-intl";\n');
  content = content.replace(/import\s*\{\s*i18n\s*\}\s*from\s*["']@lingui\/core["'];?\n?/g, "");
  content = content.replace(/import\s*\{\s*I18nProvider\s*\}\s*from\s*["']@lingui\/react["'];?\n?/g, "");
  // Also remove combined imports
  content = content.replace(/import\s*\{[^}]*useLingui[^}]*\}\s*from\s*["']@lingui\/react["'];?\n?/g, (m) => {
    if (m.includes("useLingui")) {
      return 'import { useTranslations } from "next-intl";\n';
    }
    return m;
  });

  // Handle const { i18n } = useLingui();
  // Replace with const t = useTranslations();
  // We use root translations so full keys work. For files that need namespace, we could still use root.
  // Detect simple case: const { i18n } = useLingui();
  content = content.replace(/const\s*\{\s*i18n\s*\}\s*=\s*useLingui\(\);\s*\n?/g, 'const t = useTranslations();\n');
  // Also handle destructured with other vars? Not needed.
  // Handle import { useLingui } already replaced, but leftover useLingui() calls?
  content = content.replace(/useLingui\(\)/g, 'useTranslations() as unknown as { i18n: { _: (k:string, v?:any)=>string } }');

  // Now replace i18n._("literal") and i18n._("literal", { vars })
  // We need to handle literal strings with placeholders.
  // We'll match i18n._("...") or i18n._('...') or i18n._(`...`) but mostly double quotes.
  // Use regex to find i18n._("...") occurrences
  // We need to handle multiline like i18n._(\n  "literal"\n)

  // Helper to replace literal occurrences via map
  // We need to escape literal for map lookup: need to handle escaped quotes inside.
  const linguiRegex = /i18n\._\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\s*(?:,\s*(\{[^}]*\}))?\s*\)/g;

  content = content.replace(linguiRegex, (match, dq, sq, vars) => {
    const literal = dq ?? sq;
    // Unescape
    const unescaped = literal.replace(/\\"/g, '"').replace(/\\'/g, "'");
    const semantic = map[unescaped];
    if (!semantic) {
      console.warn(`  [${file}] No map for literal: "${unescaped}" -> keeping fallback`);
      // Try slug fallback
      const slug = unescaped.replace(/[^a-zA-Z0-9]+/g, "_").slice(0,30);
      const fallback = `common.${slug}`;
      if (vars) return `t("${fallback}", ${vars})`;
      return `t("${fallback}")`;
    }
    if (vars) {
      // vars may be like { digest: error.digest } or {slug}
      // Keep as is
      return `t("${semantic}", ${vars})`;
    }
    return `t("${semantic}")`;
  });

  // Also handle i18n._(variable) dynamic: i18n._(message as string) or i18n._(c.label) etc.
  // After previous replacement, remaining i18n._(.*) are dynamic. Replace with t(String(var))
  // But need to handle i18n._(message) where message is variable containing literal English.
  // We'll replace with t(String(var)) and add comment if needed.
  const dynamicRegex = /i18n\._\(\s*([a-zA-Z0-9_\.\[\]]+)\s*(?:as\s+string)?\s*\)/g;
  content = content.replace(dynamicRegex, (match, varName) => {
    // If varName is already handled? Check if varName is like "message" etc.
    // We'll try to map via dictionary if varName is known pattern like cfg.label, c, etc.
    // For now simple t(varName as string)
    if (varName.includes('"') || varName.includes("'")) return match; // already literal
    return `t(${varName} as string)`;
  });

  // Also handle i18n._(c.label) with translation function wrapping?
  // The offline-banner has i18n._(message as string) where message is prop; we replaced above.

  // Handle t usage for placeholders: need to ensure t import exists if file uses t
  if (content !== original) {
    // Check if we introduced t but no import
    if (content.includes("t(") && !content.includes('from "next-intl"') && !content.includes("useTranslations")) {
      // Add import at top after "use client";
      const useClientMatch = content.match(/^"use client";\s*\n/);
      if (useClientMatch) {
        content = content.replace(/^"use client";\s*\n/, `"use client";\nimport { useTranslations } from "next-intl";\n`);
      } else {
        // Add at top imports
        content = `import { useTranslations } from "next-intl";\n` + content;
      }
      // Add const t = useTranslations(); if not present and file is component
      if (!content.includes("const t = useTranslations")) {
        // Try to insert after imports
        const lines = content.split("\n");
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith("import ")) lastImportIdx = i;
        }
        if (lastImportIdx >= 0) {
          // Find next function component
        }
      }
    }

    // Ensure file still has "use client" if it uses useTranslations (which is client hook)
    // useTranslations is client hook, requires "use client". So if we removed useLingui but kept client, ensure header.
    // If file didn't have "use client" before but now uses useTranslations, add it.
    if (content.includes("useTranslations") && !content.startsWith('"use client"') && !content.startsWith("'use client'")) {
      content = `"use client";\n` + content;
    }

    // Clean up double imports
    content = content.replace(/(import \{ useTranslations \} from "next-intl";\n){2,}/g, 'import { useTranslations } from "next-intl";\n');

    // Remove unused i18n variable references like i18n._("Select language") seeds inside OfflineBanner already handled but also i18n._("Service temporarily...")
    // Also remove leftover i18n import if unused
    if (!content.includes("i18n.") && content.includes('from "@lingui')) {
      content = content.replace(/import.*@lingui.*\n/g, "");
    }

    fs.writeFileSync(file, content, "utf-8");
    changedCount++;
    const replacements = (content.match(/t\(/g) || []).length;
    totalReplacements += replacements;
    console.log(`Updated ${file} -> ${replacements} t() calls`);
  }
}

console.log(`Done: changed ${changedCount} files, total replacements ~${totalReplacements}`);

// Also handle i18n.test.ts etc: skip

