export interface Token {
  color: string;
  id: string;
  text: string;
}

const KEYWORDS = new Set([
  "import",
  "export",
  "default",
  "from",
  "const",
  "let",
  "var",
  "function",
  "return",
  "interface",
  "type",
  "extends",
  "class",
  "new",
  "this",
  "async",
  "await",
  "if",
  "else",
  "null",
  "true",
  "false",
  "void",
]);

const HOOKS = new Set([
  "useState",
  "useEffect",
  "useCallback",
  "useMemo",
  "useRef",
  "setInterval",
  "clearInterval",
  "setTimeout",
]);

const WORD_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*/;
const NUM_RE = /^[0-9]+/;
const CAPITAL_RE = /^[A-Z]/;

function getWordColor(word: string): string {
  if (KEYWORDS.has(word)) {
    return "#7CB8F5";
  }
  if (HOOKS.has(word)) {
    return "#4ECDC4";
  }
  if (CAPITAL_RE.test(word)) {
    return "#9ECFD8";
  }
  return "#C0C0D8";
}

export function tokenizeLine(line: string, lineIndex = 0): Token[] {
  if (!line.trim()) {
    return [{ color: "transparent", id: `t-${lineIndex}-empty`, text: " " }];
  }
  if (line.trim().startsWith("//")) {
    return [{ color: "#4B6940", id: `t-${lineIndex}-comment`, text: line }];
  }

  const tokens: Token[] = [];
  let s = line;
  let tokenIdx = 0;

  while (s.length > 0) {
    const [q] = s;
    if (q === "'" || q === '"' || q === "`") {
      const end = s.indexOf(q, 1);
      if (end !== -1) {
        const text = s.slice(0, end + 1);
        tokens.push({
          color: "#CE8E6A",
          id: `t-${lineIndex}-${tokenIdx}`,
          text,
        });
        tokenIdx += 1;
        s = s.slice(end + 1);
        continue;
      }
    }
    const word = s.match(WORD_RE)?.[0];
    if (word) {
      tokens.push({
        color: getWordColor(word),
        id: `t-${lineIndex}-${tokenIdx}`,
        text: word,
      });
      tokenIdx += 1;
      s = s.slice(word.length);
      continue;
    }
    const num = s.match(NUM_RE)?.[0];
    if (num) {
      tokens.push({
        color: "#B5D9A5",
        id: `t-${lineIndex}-${tokenIdx}`,
        text: num,
      });
      tokenIdx += 1;
      s = s.slice(num.length);
      continue;
    }
    tokens.push({
      color: "#60607A",
      id: `t-${lineIndex}-${tokenIdx}`,
      text: q,
    });
    tokenIdx += 1;
    s = s.slice(1);
  }
  return tokens;
}
