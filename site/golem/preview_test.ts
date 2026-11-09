import { assertEquals } from "../lib/assert.ts";
import { createPreview } from "./preview.ts";

type Bitmap = { page: number; closed: boolean };

const setup = () => {
  const rasterized: number[] = [];
  const bitmaps: Bitmap[] = [];
  const drawn: { right: number | null; left: number | null }[] = [];
  const p = createPreview<Bitmap>({
    rasterize: (page) => {
      rasterized.push(page);
      const b = { page, closed: false };
      bitmaps.push(b);
      return Promise.resolve(b);
    },
    close: (b) => (b.closed = true),
    draw: (v) => drawn.push({ right: v.right?.bitmap.page ?? null, left: v.left?.bitmap.page ?? null }),
  });
  return { p, rasterized, bitmaps, drawn };
};

Deno.test("opening rasterizes the first spread only (page 1)", async () => {
  const { p, rasterized, drawn } = setup();
  await p.load(8);
  assertEquals(rasterized, [1]);
  assertEquals(drawn.at(-1), { right: null, left: 1 });
});

Deno.test("going forward and back does not rasterize kept pages again", async () => {
  const { p, rasterized } = setup();
  await p.load(8);
  await p.go(1);
  await p.go(0);
  await p.go(1);
  assertEquals(rasterized, [1, 2, 3]);
});

Deno.test("a new build closes the kept pages and rasterizes the shown spread only", async () => {
  const { p, rasterized, bitmaps } = setup();
  await p.load(8);
  await p.go(1);
  await p.load(8);
  assertEquals(bitmaps.slice(0, 3).map((b) => b.closed), [true, true, true]);
  assertEquals(rasterized, [1, 2, 3, 2, 3]);
});

Deno.test("a shorter new build keeps the spread within its pages", async () => {
  const { p, drawn } = setup();
  await p.load(8);
  await p.go(4);
  await p.load(3);
  assertEquals(p.index(), 1);
  assertEquals(drawn.at(-1), { right: 2, left: 3 });
});

Deno.test("the time of a spread counts only the pages rasterized for it", async () => {
  const { p } = setup();
  await p.load(8);
  await p.go(1);
  assertEquals(p.lastRasterized(), 2);
  await p.go(0);
  assertEquals(p.lastRasterized(), 0);
});
