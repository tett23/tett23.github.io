import { assertEquals } from "../lib/assert.ts";
import { offsetOf } from "./position.ts";

Deno.test("line and code point column become a UTF-16 offset", () => {
  const text = "ab\ncd\nef";
  assertEquals(offsetOf(text, 1, 1), 0);
  assertEquals(offsetOf(text, 2, 1), 3);
  assertEquals(offsetOf(text, 3, 2), 7);
});

Deno.test("characters outside the BMP count once in columns, twice in offsets", () => {
  const text = "# 𠮷𠮷\nS <- 𠮷 X";
  assertEquals(offsetOf(text, 1, 4), 4);
  assertEquals(offsetOf(text, 2, 8), 7 + 8);
});

Deno.test("positions past the end are clamped", () => {
  assertEquals(offsetOf("ab\ncd", 9, 1), 5);
  assertEquals(offsetOf("ab\ncd", 1, 99), 2);
});
