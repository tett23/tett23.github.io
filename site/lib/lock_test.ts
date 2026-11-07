import { assertEquals, assertThrows } from "./assert.ts";
import { readLock } from "./lock.ts";

Deno.test("lock lines are name, URL and SHA-256; comments and blanks are skipped", () => {
  const sha = "a".repeat(64);
  assertEquals(readLock(`# comment\n\nx.wasm https://e/x.wasm ${sha}\n  y  https://e/y   ${sha}  \n`), [
    { name: "x.wasm", url: "https://e/x.wasm", sha256: sha },
    { name: "y", url: "https://e/y", sha256: sha },
  ]);
});

Deno.test("malformed lock lines are rejected", () => {
  assertThrows(() => readLock("x.wasm https://e/x"));
  assertThrows(() => readLock(`x https://e/x ${"z".repeat(64)}`));
});
