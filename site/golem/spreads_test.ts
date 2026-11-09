import { assertEquals } from "../lib/assert.ts";
import { spreadOf, spreads } from "./spreads.ts";

Deno.test("right-bound spreads: page 1 alone on the left, then even right and odd left (ADR 0003)", () => {
  assertEquals(spreads(8), [
    { right: null, left: 1 },
    { right: 2, left: 3 },
    { right: 4, left: 5 },
    { right: 6, left: 7 },
    { right: 8, left: null },
  ]);
  assertEquals(spreads(7).at(-1), { right: 6, left: 7 });
  assertEquals(spreads(1), [{ right: null, left: 1 }]);
  assertEquals(spreads(0), []);
});

Deno.test("the spread of a page", () => {
  assertEquals(spreadOf(1), 0);
  assertEquals(spreadOf(2), 1);
  assertEquals(spreadOf(3), 1);
  assertEquals(spreadOf(8), 4);
});
