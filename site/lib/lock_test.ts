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

Deno.test("an optional fourth field is the path of the file in a tar.gz archive (ADR 0003)", () => {
  const sha = "b".repeat(64);
  assertEquals(readLock(`g.wasm https://e/g.tar.gz ${sha} g-1/golem.wasm\nx https://e/x ${sha}\n`), [
    { name: "g.wasm", url: "https://e/g.tar.gz", sha256: sha, member: "g-1/golem.wasm" },
    { name: "x", url: "https://e/x", sha256: sha },
  ]);
  assertThrows(() => readLock(`g https://e/g.tar.gz ${sha} a b`));
});
