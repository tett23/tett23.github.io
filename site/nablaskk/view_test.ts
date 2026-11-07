import { assertEquals } from "../lib/assert.ts";
import type { State } from "./engine.ts";
import { modeLabel, view } from "./view.ts";

const state = (s: Partial<State> = {}): State => ({
  fixed: "",
  composing: "",
  cursor: 0,
  mode: "hirakana",
  candidates: { visible: false, items: [], cursor: 0, page: 0, pageCount: 0 },
  annotation: null,
  ...s,
});

Deno.test("no candidate list while candidates.visible is false", () => {
  const v = view(state({ composing: "▼漢字" }));
  assertEquals(v.candidates, null);
  assertEquals(v.composing, "▼漢字");
});

Deno.test("the candidate list shows the page and marks the cursor", () => {
  const v = view(state({
    composing: "▼公",
    candidates: { visible: true, items: ["公", "功", "効"], cursor: 1, page: 1, pageCount: 2 },
  }));
  assertEquals(v.candidates, {
    items: [
      { label: "a", text: "公", selected: false },
      { label: "s", text: "功", selected: true },
      { label: "d", text: "効", selected: false },
    ],
    page: "1 / 2",
  });
});

Deno.test("no annotation field while annotation is null", () => {
  assertEquals(view(state()).annotation, null);
  assertEquals(view(state({ annotation: "わるし（形）" })).annotation, "わるし（形）");
});

Deno.test("registration is shown in the field as composing", () => {
  assertEquals(view(state({ composing: "[登録：かんじ]" })).composing, "[登録：かんじ]");
});

Deno.test("the caret splits composing counted from the end", () => {
  assertEquals(view(state({ composing: "▽かんじ", cursor: 0 })).caret, ["▽かんじ", ""]);
  assertEquals(view(state({ composing: "▽かんじ", cursor: -1 })).caret, ["▽かん", "じ"]);
  assertEquals(view(state({ composing: "▽𠮷や", cursor: -2 })).caret, ["▽", "𠮷や"]);
});

Deno.test("mode labels", () => {
  assertEquals(
    ["hirakana", "katakana", "jisx0201kana", "ascii", "jisx0208latin"].map(modeLabel),
    ["かな", "カナ", "半角カナ", "英数", "全角英数"],
  );
});
