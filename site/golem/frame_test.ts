import { assert, assertEquals, assertThrows } from "../lib/assert.ts";
import { decodeResult, encodeInput } from "./frame.ts";

const le = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
const enc = (s: string) => [...new TextEncoder().encode(s)];

Deno.test("the input frame is path length, path, content length, content, per file, little-endian", () => {
  const out = encodeInput([
    { path: "a.gm", bytes: new Uint8Array([1, 2, 3]) },
    { path: "字.toml", bytes: new Uint8Array([]) },
  ]);
  assertEquals([...out], [
    ...le(4),
    ...enc("a.gm"),
    ...le(3),
    1,
    2,
    3,
    ...le(enc("字.toml").length),
    ...enc("字.toml"),
    ...le(0),
  ]);
});

const result = (status: number, pdf: number[], json: string) =>
  new Uint8Array([status, ...le(pdf.length), ...pdf, ...le(enc(json).length), ...enc(json)]);

Deno.test("a result frame gives the PDF and the diagnostics", () => {
  const json = JSON.stringify([{
    code: "G1",
    severity: "error",
    span: { file: "style.toml", line: 2, column: 3 },
    message: "m",
  }]);
  const r = decodeResult(result(0, [0x25, 0x50], json));
  assert(r.status === 0);
  assertEquals([...r.pdf!], [0x25, 0x50]);
  assertEquals(r.diagnostics, [{
    code: "G1",
    severity: "error",
    span: { file: "style.toml", line: 2, column: 3 },
    message: "m",
  }]);
});

Deno.test("a PDF of length 0 is no PDF", () => {
  const r = decodeResult(result(0, [], "[]"));
  assert(r.status === 0);
  assertEquals(r.pdf, null);
});

Deno.test("status 1 is an input frame that cannot be read", () => {
  assertEquals(decodeResult(result(1, [], "")), { status: 1 });
});

Deno.test("a short result frame is an error", () => {
  assertThrows(() => decodeResult(new Uint8Array([0, 5, 0, 0, 0, 1])));
  assertThrows(() => decodeResult(new Uint8Array([])));
});
