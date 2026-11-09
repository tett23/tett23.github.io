// The input and result frames of golem.wasm (Golem v0.1.0-rc4 README, ADR 0003).

export type InputFile = { path: string; bytes: Uint8Array };

export type Span = { file: string; line: number; column: number };
export type Diagnostic = { code: string; severity: string; span?: Span | null; message: string };

export type Result =
  | { status: 0; pdf: Uint8Array<ArrayBuffer> | null; diagnostics: Diagnostic[] }
  | { status: 1 };

const u32 = (view: DataView, at: number, n: number) => view.setUint32(at, n, true);

export const encodeInput = (files: readonly InputFile[]): Uint8Array<ArrayBuffer> => {
  const enc = new TextEncoder();
  const parts = files.map((f) => ({ path: enc.encode(f.path), bytes: f.bytes }));
  const out = new Uint8Array(parts.reduce((n, p) => n + 8 + p.path.length + p.bytes.length, 0));
  const view = new DataView(out.buffer);
  parts.reduce((at, p) => {
    u32(view, at, p.path.length);
    out.set(p.path, at + 4);
    const c = at + 4 + p.path.length;
    u32(view, c, p.bytes.length);
    out.set(p.bytes, c + 4);
    return c + 4 + p.bytes.length;
  }, 0);
  return out;
};

export const decodeResult = (bytes: Uint8Array): Result => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const need = (end: number) => {
    if (end > bytes.length) throw new Error(`golem.wasm: short result frame (${bytes.length} bytes)`);
  };
  need(1);
  if (bytes[0] === 1) return { status: 1 };
  if (bytes[0] !== 0) throw new Error(`golem.wasm: unknown status ${bytes[0]}`);
  need(5);
  const pdfLen = view.getUint32(1, true);
  need(9 + pdfLen);
  const jsonLen = view.getUint32(5 + pdfLen, true);
  need(9 + pdfLen + jsonLen);
  const json = new TextDecoder().decode(bytes.subarray(9 + pdfLen, 9 + pdfLen + jsonLen));
  const raw = JSON.parse(json) as (Diagnostic & { span?: (Span & Record<string, unknown>) | null })[];
  return {
    status: 0,
    pdf: pdfLen === 0 ? null : bytes.slice(5, 5 + pdfLen),
    diagnostics: raw.map((d) => ({
      code: d.code,
      severity: d.severity,
      span: d.span ? { file: d.span.file, line: d.span.line, column: d.span.column } : null,
      message: d.message,
    })),
  };
};
