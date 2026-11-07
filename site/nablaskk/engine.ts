// The NablaSKK engine in nablaskk.wasm (NablaSKK specifications, section 12).

import { type Heap, readLengthPrefixed, writeBytes } from "../lib/mem.ts";
import type { Key } from "./keys.ts";

export type Mode = "hirakana" | "katakana" | "jisx0201kana" | "ascii" | "jisx0208latin";

export type State = {
  fixed: string;
  composing: string;
  /** Characters from the end of composing; 0 is the end. */
  cursor: number;
  mode: Mode;
  candidates: { visible: boolean; items: string[]; cursor: number; page: number; pageCount: number };
  annotation: string | null;
};

export type RuleResult = { line: number; input: string; applied: boolean; reason: string | null };

export type Engine = {
  handle(key: Key): boolean;
  state(): State;
  setRules(text: string): RuleResult[];
  free(): void;
};

type Exports = {
  memory: WebAssembly.Memory;
  nablaskk_alloc(len: number): number;
  nablaskk_free(ptr: number, len: number): void;
  nablaskk_session_new(kp: number, kl: number, rp: number, rl: number, dp: number, dl: number): number;
  nablaskk_session_free(s: number): void;
  nablaskk_handle(s: number, charcode: number, keycode: number, mods: number): number;
  nablaskk_take_state(s: number): number;
  nablaskk_set_user_rules(s: number, ptr: number, len: number): number;
};

export const loadEngine = (wasm: BufferSource | WebAssembly.Module, dict: Uint8Array): Engine => {
  const mod = wasm instanceof WebAssembly.Module ? wasm : new WebAssembly.Module(wasm);
  const e = new WebAssembly.Instance(mod, {}).exports as unknown as Exports;
  const heap: Heap = { memory: e.memory, alloc: e.nablaskk_alloc, free: e.nablaskk_free };

  const withBytes = <T>(bytes: Uint8Array, fn: (ptr: number, len: number) => T): T => {
    const { ptr, len } = writeBytes(heap, bytes);
    try {
      return fn(ptr, len);
    } finally {
      e.nablaskk_free(ptr, len);
    }
  };

  const json = <T>(ptr: number): T => JSON.parse(new TextDecoder().decode(readLengthPrefixed(heap, ptr)));

  // Lengths of 0 use the embedded data/keymap.conf and kana rules.
  const session = withBytes(dict, (dp, dl) => e.nablaskk_session_new(0, 0, 0, 0, dp, dl));
  if (session === 0) throw new Error("nablaskk: could not create a session");

  return {
    handle: (k) => e.nablaskk_handle(session, k.charcode, k.keycode, k.mods) === 1,
    state: () => json<State>(e.nablaskk_take_state(session)),
    setRules: (text) =>
      withBytes(new TextEncoder().encode(text), (p, l) => json<RuleResult[]>(e.nablaskk_set_user_rules(session, p, l))),
    free: () => e.nablaskk_session_free(session),
  };
};
