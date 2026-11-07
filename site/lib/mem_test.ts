import { assertEquals } from "./assert.ts";
import { type Heap, readBytes, readLengthPrefixed, readString, writeBytes, writeString } from "./mem.ts";

// A bump allocator standing in for the alloc export of a product wasm.
const fakeHeap = (pages = 1): Heap & { freed: [number, number][] } => {
  const memory = new WebAssembly.Memory({ initial: pages, maximum: 1024 });
  let top = 8;
  const freed: [number, number][] = [];
  return {
    memory,
    alloc: (n) => {
      const p = top;
      top += n + 8;
      const need = Math.ceil(top / 65536) - memory.buffer.byteLength / 65536;
      if (need > 0) memory.grow(need);
      return p;
    },
    free: (p, n) => freed.push([p, n]),
    freed,
  };
};

Deno.test("bytes round-trip through wasm memory", () => {
  const heap = fakeHeap();
  for (const b of [new Uint8Array(), new Uint8Array([0, 1, 255]), crypto.getRandomValues(new Uint8Array(1000))]) {
    const { ptr, len } = writeBytes(heap, b);
    assertEquals(len, b.length);
    assertEquals(readBytes(heap.memory, ptr, len), b);
  }
});

Deno.test("strings round-trip, including non-ASCII", () => {
  const heap = fakeHeap();
  for (const s of ["", "ascii", "▽かんじ ▼漢字 𠮷", "\u0000nul"]) {
    const { ptr, len } = writeString(heap, s);
    assertEquals(readString(heap.memory, ptr, len), s);
  }
});

Deno.test("large inputs grow memory and round-trip", () => {
  const heap = fakeHeap();
  const big = new Uint8Array(4 * 1024 * 1024).map((_, i) => i % 251);
  const { ptr, len } = writeBytes(heap, big);
  assertEquals(readBytes(heap.memory, ptr, len), big);
});

Deno.test("read bytes are a copy, not a view", () => {
  const heap = fakeHeap();
  const { ptr, len } = writeBytes(heap, new Uint8Array([1, 2, 3]));
  const out = readBytes(heap.memory, ptr, len);
  new Uint8Array(heap.memory.buffer, ptr, 1)[0] = 9;
  assertEquals(out[0], 1);
});

Deno.test("length-prefixed buffers are read and freed with 4 + length", () => {
  const heap = fakeHeap();
  const body = new TextEncoder().encode('{"ok":"値"}');
  const ptr = heap.alloc(4 + body.length);
  new DataView(heap.memory.buffer).setUint32(ptr, body.length, true);
  new Uint8Array(heap.memory.buffer, ptr + 4).set(body);
  assertEquals(readLengthPrefixed(heap, ptr), body);
  assertEquals(heap.freed, [[ptr, 4 + body.length]]);
});
