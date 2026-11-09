// Runs golem.wasm and shem.wasm off the main thread (tett23/tett23 ADR 0005, ADR 0006, ADR 0003).

import { serve } from "../lib/rpc.ts";
import type { Diagnostic } from "./frame.ts";
import { type Golem, loadGolem } from "./golem.ts";
import { type Doc, loadShem, type Shem } from "./shem.ts";

export const DPI = 300;

export type Request =
  | { op: "init" }
  | { op: "build"; style: string; source: string }
  | { op: "render"; id: number; page: number };

export type Built =
  | {
    status: 0;
    id: number;
    diagnostics: Diagnostic[];
    pdf: Uint8Array<ArrayBuffer> | null;
    pageCount: number;
    ms: number;
  }
  | { status: 1; ms: number };

export type Rendered = { bitmap: ImageBitmap; ms: number };
export type Response = { version: string } | Built | Rendered;

const asset = (name: string) => new URL(`../assets/${name}`, import.meta.url);
const text = (url: URL) => fetch(url).then((r) => r.ok ? r.text() : Promise.reject(new Error(`${url}: ${r.status}`)));
const bytes = (url: URL) =>
  fetch(url).then((r) => r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${url}: ${r.status}`)))
    .then((b) => new Uint8Array(b));

type State = { golem: Golem; shem: Shem; manifest: string; font: Uint8Array };

let state: Promise<State> | undefined;
let doc: { id: number; doc: Doc } | undefined;
let nextId = 0;

const init = () =>
  state ??= Promise.all([
    WebAssembly.compileStreaming(fetch(asset("golem.wasm"))).then((m) => loadGolem(m)),
    WebAssembly.compileStreaming(fetch(asset("shem.wasm"))).then(loadShem),
    text(new URL("./sample/manifest.toml", import.meta.url)),
    bytes(asset("NotoSerifJP-Regular.otf")),
  ]).then(([golem, shem, manifest, font]) => ({ golem, shem, manifest, font }));

serve<Request, Response>(self as unknown as Worker, async (req) => {
  const s = await init();
  switch (req.op) {
    case "init":
      return { version: s.golem.version };
    case "build": {
      const t = performance.now();
      const r = s.golem.build({ manifest: s.manifest, style: req.style, source: req.source, font: s.font });
      if (r.status === 1) return { status: 1, ms: Math.round(performance.now() - t) };
      const id = ++nextId;
      let pageCount = 0;
      if (r.pdf) {
        doc?.doc.close();
        doc = { id, doc: s.shem.open(r.pdf, DPI) };
        pageCount = doc.doc.pageCount;
      }
      return {
        status: 0,
        id: r.pdf ? id : 0,
        diagnostics: r.diagnostics,
        pdf: r.pdf,
        pageCount,
        ms: Math.round(performance.now() - t),
      };
    }
    case "render": {
      if (!doc || doc.id !== req.id) throw new Error("stale");
      const t = performance.now();
      const img = doc.doc.render(req.page - 1);
      const bitmap = await createImageBitmap(new ImageData(img.rgba, img.width, img.height));
      return { bitmap, ms: Math.round(performance.now() - t) };
    }
  }
});
