// The grammar AST JSON as a tree to show, with positions filled from the
// nearest ancestor (peg-hs ADR 0078).

import type { AstNode } from "./peghs.ts";

export type TreeNode = { label: string; line: number; column: number; children: TreeNode[] };

export const toTree = (n: AstNode, line = 1, column = 1): TreeNode => {
  const l = n.line ?? line;
  const c = n.line === null ? column : n.column ?? column;
  return {
    label: n.text === null ? n.kind : `${n.kind} ${n.text}`,
    line: l,
    column: c,
    children: n.children.map((child) => toTree(child, l, c)),
  };
};

export const countNodes = (t: TreeNode): number => 1 + t.children.reduce((s, c) => s + countNodes(c), 0);

export const depth = (t: TreeNode): number => 1 + Math.max(0, ...t.children.map(depth));
