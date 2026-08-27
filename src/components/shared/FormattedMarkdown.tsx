"use client";

import { Check, Copy, FileCode } from "lucide-react";
import { useState } from "react";
import { tokenizeLine } from "@/features/challenge/lib/tokenize";

const NUMBERED_LIST_REGEX = /^(\d+)\.\s+(.*)$/;

interface FormattedMarkdownProps {
  className?: string;
  content: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.trim().split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border/90 bg-black/80 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-border/70 border-b bg-card/60 px-3.5 py-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <FileCode className="text-primary" size={13} />
          <span className="font-semibold text-heading uppercase tracking-wider">
            {language || "code"}
          </span>
        </div>
        <button
          className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          onClick={handleCopy}
          type="button"
        >
          {copied ? (
            <>
              <Check className="text-emerald-400" size={11} />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Formatted Code Lines with Syntax Coloring */}
      <div className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const tokens = tokenizeLine(line, lineNum);
              return (
                <tr className="hover:bg-white/3" key={`line-${lineNum}`}>
                  <td className="w-8 select-none pe-3 text-right font-mono text-[11px] text-slate-600">
                    {lineNum}
                  </td>
                  <td className="whitespace-pre ps-2 pe-4">
                    {tokens.map((t) => (
                      <span key={t.id} style={{ color: t.color }}>
                        {t.text}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderFormattedLine(line: string) {
  // Check for headings
  if (line.startsWith("### ")) {
    return (
      <h4
        className="mt-3.5 mb-1.5 font-semibold text-[13px] text-heading tracking-tight"
        key={line}
      >
        {renderInlineFormatting(line.slice(4))}
      </h4>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <h3
        className="mt-4 mb-2 border-border/50 border-b pb-1 font-bold text-[14px] text-heading tracking-tight"
        key={line}
      >
        {renderInlineFormatting(line.slice(3))}
      </h3>
    );
  }

  if (line.startsWith("# ")) {
    return (
      <h2
        className="mt-4 mb-2 font-bold text-[15px] text-heading tracking-tight"
        key={line}
      >
        {renderInlineFormatting(line.slice(2))}
      </h2>
    );
  }

  // Check for bullet list item
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <li className="my-1 ms-4 list-disc ps-1 text-[12.5px]" key={line}>
        {renderInlineFormatting(line.slice(2))}
      </li>
    );
  }

  // Check for numbered list item (e.g. "1. ")
  const numMatch = line.match(NUMBERED_LIST_REGEX);
  if (numMatch) {
    return (
      <li
        className="my-1 ms-4 list-decimal ps-1 text-[12.5px]"
        key={line}
        value={Number(numMatch[1])}
      >
        {renderInlineFormatting(numMatch[2])}
      </li>
    );
  }

  if (!line.trim()) {
    return <div className="h-2" key={line} />;
  }

  return (
    <p className="my-1.5 text-[12.5px] leading-relaxed" key={line}>
      {renderInlineFormatting(line)}
    </p>
  );
}

function renderInlineFormatting(text: string) {
  // Regex to split by inline code `code` and bold **bold**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-medium font-mono text-[11.5px] text-primary"
          key={codeContent}
        >
          {codeContent}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong className="font-semibold text-heading" key={boldContent}>
          {boldContent}
        </strong>
      );
    }

    return part;
  });
}

export function FormattedMarkdown({
  content,
  className = "",
}: FormattedMarkdownProps) {
  if (!content) {
    return null;
  }

  // Parse fenced code blocks
  const blocks: Array<
    | { type: "code"; code: string; language: string }
    | { type: "text"; text: string }
  > = [];

  const rawLines = content.split("\n");
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeBuffer: string[] = [];
  let textBuffer: string[] = [];

  for (const line of rawLines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          code: codeBuffer.join("\n"),
          language: codeLanguage,
          type: "code",
        });
        codeBuffer = [];
        inCodeBlock = false;
        codeLanguage = "";
      } else {
        // Start code block
        if (textBuffer.length > 0) {
          blocks.push({ text: textBuffer.join("\n"), type: "text" });
          textBuffer = [];
        }
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
    } else if (inCodeBlock) {
      codeBuffer.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      code: codeBuffer.join("\n"),
      language: codeLanguage,
      type: "code",
    });
  } else if (textBuffer.length > 0) {
    blocks.push({ text: textBuffer.join("\n"), type: "text" });
  }

  return (
    <div className={`text-muted-foreground ${className}`}>
      {blocks.map((block) => {
        if (block.type === "code") {
          return (
            <CodeBlock
              code={block.code}
              key={block.code}
              language={block.language}
            />
          );
        }

        const lines = block.text.split("\n");
        return (
          <div key={block.text}>
            {lines.map((line) => renderFormattedLine(line))}
          </div>
        );
      })}
    </div>
  );
}
