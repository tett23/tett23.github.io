// golem.wasm: builds the PDF of the sample project from the bytes of its files (ADR 0003).

import { createWasi } from "../lib/wasi.ts";
import { decodeResult, encodeInput, type Result } from "./frame.ts";

export type ProjectFiles = { manifest: string; style: string; source: string; font: Uint8Array };

export const SOURCE = "kumo-no-ito.gm";
export const STYLE = "style.toml";
const FONT = "fonts/NotoSerifJP-Regular.otf";

type Exports = {
  memory: WebAssembly.Memory;
  _initialize(): void;
  hs_init(argc: number, argv: number): void;
  golem_alloc(len: number): number;
  golem_free(p: number): void;
  golem_build_pdf(p: number, len: number): number;
  golem_result_len(p: number): number;
  golem_version(): number;
};

export type Golem = { version: string; build(files: ProjectFiles): Result };

export type GolemOptions = { onCall?: (name: string) => void };

export const loadGolem = async (module: WebAssembly.Module, opts: GolemOptions = {}): Promise<Golem> => {
  const wasi = createWasi({});
  const base = wasi.imports.wasi_snapshot_preview1;
  const ns = opts.onCall
    ? new Proxy(base, {
      get: (t, name) => {
        const f = t[name as string];
        return (...a: never[]) => (opts.onCall!(String(name)), f(...a));
      },
    })
    : base;
  const inst = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: ns });
  const ex = inst.exports as unknown as Exports;
  wasi.bind(ex.memory);
  ex._initialize();
  ex.hs_init(0, 0);

  const take = (p: number) => {
    const len = ex.golem_result_len(p);
    const out = new Uint8Array(ex.memory.buffer, p, len).slice();
    ex.golem_free(p);
    return out;
  };

  const enc = new TextEncoder();
  const build = (f: ProjectFiles): Result => {
    const frame = encodeInput([
      { path: "manifest.toml", bytes: enc.encode(f.manifest) },
      { path: STYLE, bytes: enc.encode(f.style) },
      { path: SOURCE, bytes: enc.encode(f.source) },
      { path: FONT, bytes: f.font },
    ]);
    const p = ex.golem_alloc(frame.length);
    new Uint8Array(ex.memory.buffer, p, frame.length).set(frame);
    const r = ex.golem_build_pdf(p, frame.length);
    ex.golem_free(p);
    return decodeResult(take(r));
  };

  return { version: new TextDecoder().decode(take(ex.golem_version())), build };
};
