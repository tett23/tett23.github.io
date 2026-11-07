// Passing bytes and strings to and from a wasm linear memory by pointer and
// length (ADR 0002).

export type Heap = {
  memory: WebAssembly.Memory;
  alloc(len: number): number;
  free(ptr: number, len: number): void;
};

export type Span = { ptr: number; len: number };

export const writeBytes = (heap: Heap, bytes: Uint8Array): Span => {
  const ptr = heap.alloc(bytes.length) >>> 0;
  // Read the buffer after alloc: allocating may have grown the memory.
  new Uint8Array(heap.memory.buffer, ptr, bytes.length).set(bytes);
  return { ptr, len: bytes.length };
};

export const writeString = (heap: Heap, s: string): Span => writeBytes(heap, new TextEncoder().encode(s));

export const readBytes = (memory: WebAssembly.Memory, ptr: number, len: number): Uint8Array =>
  new Uint8Array(memory.buffer, ptr >>> 0, len >>> 0).slice();

export const readString = (memory: WebAssembly.Memory, ptr: number, len: number): string =>
  new TextDecoder().decode(readBytes(memory, ptr, len));

/** Reads a buffer laid out as a u32 LE length and the body, then frees it. */
export const readLengthPrefixed = (heap: Heap, ptr: number): Uint8Array => {
  const p = ptr >>> 0;
  const len = new DataView(heap.memory.buffer).getUint32(p, true);
  const body = readBytes(heap.memory, p + 4, len);
  heap.free(p, 4 + len);
  return body;
};
