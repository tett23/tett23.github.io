import { assertEquals } from "../lib/assert.ts";
import { STRINGS, stringsFor } from "./strings.ts";

Deno.test("the Japanese and the English tables have the same keys", () => {
  assertEquals(Object.keys(STRINGS.ja).sort(), Object.keys(STRINGS.en).sort());
});

Deno.test("the table follows the lang of the document", () => {
  assertEquals(stringsFor("ja"), STRINGS.ja);
  assertEquals(stringsFor("en"), STRINGS.en);
  assertEquals(stringsFor("en-US"), STRINGS.en);
  assertEquals(stringsFor(""), STRINGS.ja);
});
