"use client";

import { Check, Copy, FileCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { tokenizeLine } from "@/features/challenge/lib/tokenize";
import { cn } from "@/lib/utils";

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
  const t = useTranslations();
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
            {language || t("common.code")}
          </span>
        </div>
        <Button
          className="flex h-6 items-center gap-1 rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          onClick={handleCopy}
          size="xs"
          type="button"
          variant="ghost"
        >
          {copied ? (
            <>
              <Check className="text-emerald-400" size={11} />
              <span className="text-emerald-400">{t("common.copied")}</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>{t("common.copy")}</span>
            </>
          )}
        </Button>
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

function renderFormattedLine(line: string, index: number, prefix: string) {
  const lineKey = `${prefix}-line-${index}`;

  // Check for headings
  if (line.startsWith("### ")) {
    return (
      <h4
        className="mt-3.5 mb-1.5 font-semibold text-[13px] text-heading tracking-tight"
        key={lineKey}
      >
        {renderInlineFormatting(line.slice(4), lineKey)}
      </h4>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <h3
        className="mt-4 mb-2 border-border/50 border-b pb-1 font-bold text-[14px] text-heading tracking-tight"
        key={lineKey}
      >
        {renderInlineFormatting(line.slice(3), lineKey)}
      </h3>
    );
  }

  if (line.startsWith("# ")) {
    return (
      <h2
        className="mt-4 mb-2 font-bold text-[15px] text-heading tracking-tight"
        key={lineKey}
      >
        {renderInlineFormatting(line.slice(2), lineKey)}
      </h2>
    );
  }

  // Check for bullet list item
  if (line.startsWith("- ") || line.startsWith("* ")) {
    return (
      <li className="my-1 ms-4 list-disc ps-1 text-[12.5px]" key={lineKey}>
        {renderInlineFormatting(line.slice(2), lineKey)}
      </li>
    );
  }

  // Check for numbered list item (e.g. "1. ")
  const numMatch = line.match(NUMBERED_LIST_REGEX);
  if (numMatch) {
    return (
      <li
        className="my-1 ms-4 list-decimal ps-1 text-[12.5px]"
        key={lineKey}
        value={Number(numMatch[1])}
      >
        {renderInlineFormatting(numMatch[2], lineKey)}
      </li>
    );
  }

  if (!line.trim()) {
    return <div className="h-2" key={lineKey} />;
  }

  return (
    <p className="my-1.5 text-[12.5px] leading-relaxed" key={lineKey}>
      {renderInlineFormatting(line, lineKey)}
    </p>
  );
}

function renderInlineFormatting(text: string, lineKey: string) {
  // Regex to split by inline code `code` and bold **bold**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const partKey = `${lineKey}-part-${index}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-medium font-mono text-[11.5px] text-primary"
          key={partKey}
        >
          {codeContent}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldContent = part.slice(2, -2);
      return (
        <strong className="font-semibold text-heading" key={partKey}>
          {boldContent}
        </strong>
      );
    }

    return <span key={partKey}>{part}</span>;
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
    <div className={cn("text-muted-foreground", className)}>
      {blocks.map((block, blockIndex) => {
        const blockKey = `block-${blockIndex}`;
        if (block.type === "code") {
          return (
            <CodeBlock
              code={block.code}
              key={blockKey}
              language={block.language}
            />
          );
        }

        const lines = block.text.split("\n");
        return (
          <div key={blockKey}>
            {lines.map((line, lineIndex) =>
              renderFormattedLine(line, lineIndex, blockKey)
            )}
          </div>
        );
      })}
    </div>
  );
}
