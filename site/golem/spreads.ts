// Right-bound spreads (ADR 0003): page 1 alone on the left, then the even page on the right and
// the next odd page on the left.

export type Spread = { right: number | null; left: number | null };

export const spreadOf = (page: number): number => Math.floor(page / 2);

export const spreads = (pageCount: number): Spread[] =>
  pageCount <= 0 ? [] : Array.from({ length: spreadOf(pageCount) + 1 }, (_, i) =>
    i === 0 ? { right: null, left: 1 } : {
      right: 2 * i,
      left: 2 * i + 1 <= pageCount ? 2 * i + 1 : null,
    });
