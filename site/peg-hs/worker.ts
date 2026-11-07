// Runs peg-hs.wasm off the main thread (ADR 0002, ADR 0004).

import { serve } from "../lib/rpc.ts";
import { type Analysis, type Formatted, loadPegHs } from "./peghs.ts";

export type Request = { op: "analyze" | "format"; grammar: string };
export type Response = Analysis | Formatted;

const peg = WebAssembly.compileStreaming(fetch(new URL("../assets/peg-hs.wasm", import.meta.url))).then(loadPegHs);

serve<Request, Response>(self as unknown as Worker, async (req) => {
  const p = await peg;
  return req.op === "analyze" ? p.analyze(req.grammar) : p.format(req.grammar);
});
