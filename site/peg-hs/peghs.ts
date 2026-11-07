// peg-hs.wasm: a GHC reactor with analyze and format (peg-hs ADR 0078).

import { type Heap, readLengthPrefixed, writeString } from "../lib/mem.ts";
import { createWasi } from "../lib/wasi.ts";

export type Diagnostic = { severity: "error" | "warning"; line: number; column: number; message: string };

export type AstNode = {
  kind: string;
  line: number | null;
  column: number | null;
  text: string | null;
  children: AstNode[];
};

export type Analysis = {
  diagnostics: Diagnostic[];
  ast: AstNode | null;
  types: string | null;
  module: string | null;
};

export type Formatted = { text: string | null; diagnostics: Diagnostic[] };

export type PegHs = {
  analyze(grammar: string): Analysis;
  format(grammar: string): Formatted;
};

type Exports = {
  memory: WebAssembly.Memory;
  _initialize(): void;
  hs_init(argc: number, argv: number): void;
  malloc(n: number): number;
  free(p: number): void;
  analyze(p: number, n: number): number;
  format(p: number, n: number): number;
};

export const loadPegHs = async (mod: WebAssembly.Module): Promise<PegHs> => {
  const wasi = createWasi({});
  const instance = await WebAssembly.instantiate(mod, wasi.imports as unknown as WebAssembly.Imports);
  const e = instance.exports as unknown as Exports;
  wasi.bind(e.memory);
  e._initialize();
  e.hs_init(0, 0);
  const heap: Heap = { memory: e.memory, alloc: e.malloc, free: (p) => e.free(p) };

  const call = <T>(fn: (p: number, n: number) => number, req: unknown): T => {
    const { ptr, len } = writeString(heap, JSON.stringify(req));
    try {
      const res = JSON.parse(new TextDecoder().decode(readLengthPrefixed(heap, fn(ptr, len))));
      if ("error" in res) throw new Error(`peg-hs: ${res.error}`);
      return res as T;
    } finally {
      e.free(ptr);
    }
  };

  return {
    analyze: (grammar) => call<Analysis>(e.analyze, { grammar }),
    format: (grammar) => call<Formatted>(e.format, { grammar }),
  };
};
