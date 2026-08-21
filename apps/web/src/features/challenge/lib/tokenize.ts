export interface Token {
  text: string;
  color: string;
}

const KEYWORDS = new Set([
  "import", "export", "default", "from", "const", "let", "var", "function",
  "return", "interface", "type", "extends", "class", "new", "this", "async",
  "await", "if", "else", "null", "true", "false", "void",
]);

const HOOKS = new Set([
  "useState", "useEffect", "useCallback", "useMemo", "useRef",
  "setInterval", "clearInterval", "setTimeout",
]);

export function tokenizeLine(line: string): Token[] {
  if (!line.trim()) return [{ text: " ", color: "transparent" }];
  if (line.trim().startsWith("//")) return [{ text: line, color: "#4B6940" }];

  const tokens: Token[] = [];
  let s = line;

  while (s.length > 0) {
    const q = s[0];
    if (q === "'" || q === '"' || q === "`") {
      const end = s.indexOf(q, 1);
      if (end !== -1) {
        tokens.push({ text: s.slice(0, end + 1), color: "#CE8E6A" });
        s = s.slice(end + 1);
        continue;
      }
    }
    const word = s.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)?.[0];
    if (word) {
      const color = KEYWORDS.has(word)
        ? "#7CB8F5"
        : HOOKS.has(word)
          ? "#4ECDC4"
          : /^[A-Z]/.test(word)
            ? "#9ECFD8"
            : "#C0C0D8";
      tokens.push({ text: word, color });
      s = s.slice(word.length);
      continue;
    }
    const num = s.match(/^[0-9]+/)?.[0];
    if (num) {
      tokens.push({ text: num, color: "#B5D9A5" });
      s = s.slice(num.length);
      continue;
    }
    tokens.push({ text: s[0], color: "#60607A" });
    s = s.slice(1);
  }
  return tokens;
}
