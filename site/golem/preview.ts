// The spread preview (tett23/tett23 ADR 0006, ADR 0003): rasterizes only the shown spread, keeps the
// bitmaps until the next build, and closes them then.

import { type Spread, spreads } from "./spreads.ts";

export type Shown<B> = { page: number; bitmap: B };
export type View<B> = { index: number; count: number; right: Shown<B> | null; left: Shown<B> | null };

export type PreviewOptions<B> = {
  rasterize: (page: number) => Promise<B>;
  close: (bitmap: B) => void;
  draw: (view: View<B>) => void;
};

export const createPreview = <B>(o: PreviewOptions<B>) => {
  let list: Spread[] = [];
  let kept = new Map<number, Promise<B>>();
  let index = 0;
  let generation = 0;
  let rasterized = 0;

  const page = (n: number | null): Promise<Shown<B> | null> => {
    if (n === null) return Promise.resolve(null);
    let b = kept.get(n);
    if (!b) {
      rasterized++;
      b = o.rasterize(n);
      kept.set(n, b);
    }
    return b.then((bitmap) => ({ page: n, bitmap }));
  };

  const show = async () => {
    const gen = generation;
    const s = list[index];
    if (!s) return;
    rasterized = 0;
    const [right, left] = await Promise.all([page(s.right), page(s.left)]);
    if (gen === generation) o.draw({ index, count: list.length, right, left });
  };

  return {
    load: async (pageCount: number) => {
      generation++;
      const old = kept;
      kept = new Map();
      old.forEach((b) => b.then(o.close, () => {}));
      list = spreads(pageCount);
      index = Math.max(0, Math.min(index, list.length - 1));
      await show();
    },
    go: async (i: number) => {
      if (i < 0 || i >= list.length || i === index) return;
      generation++;
      index = i;
      await show();
    },
    index: () => index,
    count: () => list.length,
    /** How many pages the last shown spread rasterized (0 when they were kept). */
    lastRasterized: () => rasterized,
  };
};
