// What the 試す field shows for an engine state (ADR 0007).

import type { Mode, State } from "./engine.ts";

const LABELS = "asdfjkl";

export type View = {
  composing: string;
  /** composing split at the caret. */
  caret: [string, string];
  mode: string;
  candidates: null | { items: { label: string; text: string; selected: boolean }[]; page: string };
  annotation: string | null;
};

const MODE_LABELS: Readonly<Record<Mode, string>> = {
  hirakana: "かな",
  katakana: "カナ",
  jisx0201kana: "半角カナ",
  ascii: "英数",
  jisx0208latin: "全角英数",
};

export const modeLabel = (m: string): string => MODE_LABELS[m as Mode] ?? m;

export const view = (s: State): View => {
  const chars = [...s.composing];
  const at = Math.max(0, Math.min(chars.length, chars.length + s.cursor));
  return {
    composing: s.composing,
    caret: [chars.slice(0, at).join(""), chars.slice(at).join("")],
    mode: modeLabel(s.mode),
    candidates: s.candidates.visible
      ? {
        items: s.candidates.items.map((text, i) => ({
          label: LABELS[Math.min(i, LABELS.length - 1)],
          text,
          selected: i === s.candidates.cursor,
        })),
        page: `${s.candidates.page} / ${s.candidates.pageCount}`,
      }
      : null,
    annotation: s.annotation,
  };
};
