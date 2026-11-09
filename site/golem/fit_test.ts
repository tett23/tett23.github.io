import { assertEquals } from "../lib/assert.ts";
import { fitCanvas } from "./fit.ts";

Deno.test("the canvas has the shown width times the pixel ratio, in the page's proportions", () => {
  assertEquals(fitCanvas(380, 2, 1512, 2150), { width: 760, height: 1081 });
  assertEquals(fitCanvas(380, 1, 1512, 2150), { width: 380, height: 540 });
});

Deno.test("it never draws larger than the rasterized page", () => {
  assertEquals(fitCanvas(1000, 2, 1512, 2150), { width: 1512, height: 2150 });
});

Deno.test("a frame not laid out yet draws at the rasterized size", () => {
  assertEquals(fitCanvas(0, 2, 1512, 2150), { width: 1512, height: 2150 });
});
