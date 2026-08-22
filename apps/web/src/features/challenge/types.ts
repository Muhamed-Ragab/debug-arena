export type RightTab = "explain" | "fix" | "hints";

export type DiffLineType = "ctx" | "add" | "del";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

export type FileTreeNode =
  | { type: "folder"; name: string; depth: number }
  | { type: "file"; name: string; depth: number; highlight?: boolean };
