"use client";

import { GripVertical } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { CATEGORY_CONFIG } from "@/lib/domain/categories";
import type { Challenge } from "@/lib/domain/types";
import { useChallengeWorkspace } from "../hooks/useChallengeWorkspace";
import type { DiffLine } from "../types";
import { ChallengeScenario } from "./ChallengeScenario";
import { ChallengeTabs } from "./ChallengeTabs";
import { CodeViewer } from "./CodeViewer";
import type { HintItem } from "./HintsPanel";
import { SubmitBar } from "./SubmitBar";

interface Props {
  challenge: Challenge;
  codeLines?: string[];
  diffLines?: DiffLine[];
  fileName?: string;
  hints?: HintItem[];
  onSubmit?: (submissionId: string) => void;
  scenarioParagraphs?: string[];
}

const DEFAULT_LEFT_WIDTH = 300;
const MIN_LEFT_WIDTH = 220;
const MAX_LEFT_WIDTH = 500;

const DEFAULT_RIGHT_WIDTH = 360;
const MIN_RIGHT_WIDTH = 260;
const MAX_RIGHT_WIDTH = 560;

export function ChallengeScreen({
  challenge,
  onSubmit,
  codeLines,
  fileName,
  hints,
  diffLines,
  scenarioParagraphs,
}: Props) {
  const cfg =
    CATEGORY_CONFIG[challenge.category] ?? CATEGORY_CONFIG["React Rendering"];
  const ws = useChallengeWorkspace(challenge.id, onSubmit);

  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);

  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    setIsResizing(true);
  }, []);

  const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current === true) {
        const newWidth = Math.min(
          MAX_LEFT_WIDTH,
          Math.max(MIN_LEFT_WIDTH, e.clientX)
        );
        setLeftWidth(newWidth);
      } else if (isDraggingRight.current === true) {
        const newWidth = Math.min(
          MAX_RIGHT_WIDTH,
          Math.max(MIN_RIGHT_WIDTH, window.innerWidth - e.clientX)
        );
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className={`flex h-full w-full flex-col ${isResizing ? "cursor-col-resize select-none" : ""}`}
    >
      <TopBar
        crumbs={[
          { label: "Challenges", to: "/challenges" },
          { label: challenge.title },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Left: Challenge Scenario */}
        <div
          className="w-full shrink-0 overflow-hidden lg:h-full"
          style={{ width: `${leftWidth}px` }}
        >
          <ChallengeScenario
            cfg={cfg}
            challenge={challenge}
            className="h-full w-full"
            scenarioParagraphs={scenarioParagraphs}
            setTreeOpen={ws.setTreeOpen}
            treeOpen={ws.treeOpen}
          />
        </div>

        {/* Left Resize Splitter Handle */}
        <div
          aria-label="Resize left sidebar"
          aria-valuemax={MAX_LEFT_WIDTH}
          aria-valuemin={MIN_LEFT_WIDTH}
          aria-valuenow={leftWidth}
          className="group relative hidden w-1.5 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-primary/60 active:bg-primary lg:flex"
          onDoubleClick={() => setLeftWidth(DEFAULT_LEFT_WIDTH)}
          onMouseDown={handleLeftMouseDown}
          role="slider"
          tabIndex={0}
          title="Drag to resize sidebar (Double click to reset)"
        >
          <div className="z-10 flex h-6 w-3 items-center justify-center rounded-full bg-card/80 text-muted-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
            <GripVertical size={10} />
          </div>
        </div>

        {/* Middle: Code Viewer */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CodeViewer
            cfg={cfg}
            codeLines={codeLines}
            fileName={fileName}
            onClearLines={ws.clearLines}
            onToggleLine={ws.toggleLine}
            selectedLine={ws.selectedLine}
            selectedLines={ws.selectedLines}
          />
        </div>

        {/* Right Resize Splitter Handle */}
        <div
          aria-label="Resize right sidebar"
          aria-valuemax={MAX_RIGHT_WIDTH}
          aria-valuemin={MIN_RIGHT_WIDTH}
          aria-valuenow={rightWidth}
          className="group relative hidden w-1.5 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-primary/60 active:bg-primary lg:flex"
          onDoubleClick={() => setRightWidth(DEFAULT_RIGHT_WIDTH)}
          onMouseDown={handleRightMouseDown}
          role="slider"
          tabIndex={0}
          title="Drag to resize tabs panel (Double click to reset)"
        >
          <div className="z-10 flex h-6 w-3 items-center justify-center rounded-full bg-card/80 text-muted-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
            <GripVertical size={10} />
          </div>
        </div>

        {/* Right: Tabs & Submit Bar */}
        <div
          className="flex w-full shrink-0 flex-col border-border border-t lg:h-full lg:border-t-0"
          style={{ width: `${rightWidth}px` }}
        >
          <ChallengeTabs
            diffLines={diffLines}
            explanation={ws.explanation}
            hints={hints}
            hintsOpen={ws.hintsOpen}
            rightTab={ws.rightTab}
            setExplanation={ws.setExplanation}
            setRightTab={ws.setRightTab}
            setSolution={ws.setSolution}
            solution={ws.solution}
            toggleHint={ws.toggleHint}
          />
          {ws.error ? (
            <div className="bg-destructive/10 px-4 py-2 text-destructive text-xs">
              {ws.error}
            </div>
          ) : null}
          <SubmitBar
            fileName={fileName}
            isSubmitting={ws.isSubmitting}
            onSubmit={ws.submit}
            selectedLine={ws.selectedLine}
            selectedLines={ws.selectedLines}
          />
        </div>
      </div>
    </div>
  );
}
