export type RightTab = "explain" | "fix" | "hints";

export type DiffLineType = "ctx" | "add" | "del";

export interface DiffLine {
  text: string;
  type: DiffLineType;
}

export type FileTreeNode =
  | { type: "folder"; name: string; depth: number }
  | { type: "file"; name: string; depth: number; highlight?: boolean };
