// Runs the released nablaskk.wasm and SKK-JISYO.S of wasm.lock in Deno
// (ADR 0003, with the tests of ADR 0007).
import { assert, assertEquals, assertMatch } from "../lib/assert.ts";
import { type Engine, loadEngine } from "./engine.ts";
import { type BrowserKey, translate } from "./keys.ts";

const assets = Deno.env.get("ASSETS_DIR") ?? new URL("../../_assets/", import.meta.url).pathname;
const wasm = await Deno.readFile(`${assets}/nablaskk.wasm`);
const dict = await Deno.readFile(`${assets}/SKK-JISYO.S`);

const engine = () => loadEngine(wasm, dict);

const codeOf = (ch: string) =>
  ch === " " ? "Space" : /[a-z]/i.test(ch) ? `Key${ch.toUpperCase()}` : ch === "." ? "Period" : "Unidentified";

const press = (e: Engine, ev: Partial<BrowserKey> & { key: string }) => {
  const k = translate({
    code: codeOf(ev.key),
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    isComposing: false,
    ...ev,
  });
  if (k.kind !== "key") throw new Error(`not a key: ${ev.key}`);
  return e.handle(k);
};

// Types text the way a person would: capitals with Shift.
const type = (e: Engine, text: string) => {
  for (const ch of text) press(e, { key: ch, shiftKey: /[A-Z]/.test(ch) });
};

const space = (e: Engine, times = 1) => {
  for (let i = 0; i < times; i++) press(e, { key: " " });
};

Deno.test("Kanji then Space shows the first candidate inline, without the window", () => {
  const e = engine();
  type(e, "Kanji");
  space(e);
  const s = e.state();
  assertEquals(s.composing, "▼漢字");
  assertEquals(s.candidates.visible, false);
  e.free();
});

Deno.test("Kou: the window opens at the fifth Space", () => {
  const e = engine();
  type(e, "Kou");
  for (let i = 1; i <= 4; i++) {
    space(e);
    assertEquals(e.state().candidates.visible, false, `space ${i}`);
  }
  space(e);
  const s = e.state();
  assertEquals(s.candidates.visible, true);
  assert(s.candidates.items.length > 0);
  e.free();
});

Deno.test("Kanji and three Spaces run out of candidates and start registration", () => {
  const e = engine();
  type(e, "Kanji");
  space(e, 3);
  assertMatch(e.state().composing, /^\[登録：かんじ\]/);
  e.free();
});

Deno.test("KaKu converts with okurigana", () => {
  const e = engine();
  type(e, "KaKu");
  const s = e.state();
  assertMatch(s.composing, /^▼書く/);
  e.free();
});

Deno.test("after adding fj,、,、,､ typing fj commits 、", () => {
  const e = engine();
  const results = e.setRules("fj,、,、,､");
  assertEquals(results, [{ line: 1, input: "fj", applied: true, reason: null }]);
  type(e, "fj");
  assertEquals(e.state().fixed, "、");
  e.free();
});

Deno.test("a rule clashing with a built-in one is not applied and says why", () => {
  const e = engine();
  const [r] = e.setRules("ka.,か。,カ。,ｶ｡");
  assertEquals(r.applied, false);
  assert(r.reason !== null && r.reason.length > 0);
  type(e, "ka");
  assertEquals(e.state().fixed, "か");
  e.free();
});

Deno.test("fixed text is taken once", () => {
  const e = engine();
  type(e, "a");
  assertEquals(e.state().fixed, "あ");
  assertEquals(e.state().fixed, "");
  e.free();
});

Deno.test("handle reports whether the engine used the key", () => {
  const e = engine();
  assertEquals(press(e, { key: "a" }), true);
  assertEquals(press(e, { key: "Tab", code: "Tab" }), false);
  e.free();
});
