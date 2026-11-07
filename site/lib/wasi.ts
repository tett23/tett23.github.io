// A minimal WASI preview1 for the GHC wasm reactors (ADR 0002).
// Only args, environment, clocks, randomness, stdout/stderr and proc_exit are
// implemented. Everything else, including the file system, returns ENOSYS.

export const ENOSYS = 52;
const ESUCCESS = 0;
const EBADF = 8;

export const IMPLEMENTED: ReadonlySet<string> = new Set([
  "args_get",
  "args_sizes_get",
  "environ_get",
  "environ_sizes_get",
  "clock_time_get",
  "random_get",
  "fd_write",
  "proc_exit",
]);

export type WasiOptions = {
  args?: readonly string[];
  env?: Readonly<Record<string, string>>;
  /** Nanoseconds for the given WASI clock id. */
  now?: (clockId: number) => bigint;
  random?: (buf: Uint8Array<ArrayBuffer>) => void;
};

export type ProcExit = Error & { readonly exitCode: number };

export const isProcExit = (e: unknown): e is ProcExit =>
  e instanceof Error && typeof (e as Partial<ProcExit>).exitCode === "number";

const procExit = (code: number): ProcExit => Object.assign(new Error(`proc_exit(${code})`), { exitCode: code });

const defaultNow = (clockId: number): bigint =>
  clockId === 0
    ? BigInt(Date.now()) * 1_000_000n
    : BigInt(Math.round((performance.timeOrigin + performance.now()) * 1e6));

const defaultRandom = (buf: Uint8Array<ArrayBuffer>) => {
  for (let i = 0; i < buf.length; i += 65536) crypto.getRandomValues(buf.subarray(i, i + 65536));
};

const concat = (chunks: readonly Uint8Array[]) => {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  chunks.reduce((at, c) => (out.set(c, at), at + c.length), 0);
  return out;
};

export type Wasi = {
  imports: { wasi_snapshot_preview1: Record<string, (...args: never[]) => number> };
  bind(memory: WebAssembly.Memory): void;
  stdout(): Uint8Array;
  stderr(): Uint8Array;
  stdoutText(): string;
  stderrText(): string;
};

export const createWasi = (opts: WasiOptions): Wasi => {
  const enc = new TextEncoder();
  const args = (opts.args ?? []).map((a) => enc.encode(a + "\0"));
  const env = Object.entries(opts.env ?? {}).map(([k, v]) => enc.encode(`${k}=${v}\0`));
  const now = opts.now ?? defaultNow;
  const random = opts.random ?? defaultRandom;
  const out: Uint8Array[] = [];
  const err: Uint8Array[] = [];
  let memory: WebAssembly.Memory | undefined;

  const mem = () => {
    if (!memory) throw new Error("wasi: memory is not bound");
    return { view: new DataView(memory.buffer), bytes: new Uint8Array(memory.buffer) };
  };

  const sizes = (list: Uint8Array[]) => (countPtr: number, bufSizePtr: number) => {
    const { view } = mem();
    view.setUint32(countPtr, list.length, true);
    view.setUint32(bufSizePtr, list.reduce((n, s) => n + s.length, 0), true);
    return ESUCCESS;
  };

  const layout = (list: Uint8Array[]) => (ptrs: number, buf: number) => {
    const { view, bytes } = mem();
    list.reduce((at, s, i) => {
      view.setUint32(ptrs + i * 4, at, true);
      bytes.set(s, at);
      return at + s.length;
    }, buf);
    return ESUCCESS;
  };

  const fns: Record<string, (...args: never[]) => number> = {
    args_sizes_get: sizes(args),
    args_get: layout(args),
    environ_sizes_get: sizes(env),
    environ_get: layout(env),
    clock_time_get: (id: number, _precision: bigint, ptr: number) => {
      mem().view.setBigUint64(ptr, now(id), true);
      return ESUCCESS;
    },
    random_get: (ptr: number, len: number) => {
      random(new Uint8Array(mem().bytes.buffer as ArrayBuffer, ptr, len));
      return ESUCCESS;
    },
    fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
      const sink = fd === 1 ? out : fd === 2 ? err : undefined;
      if (!sink) return EBADF;
      const { view, bytes } = mem();
      let total = 0;
      for (let i = 0; i < iovsLen; i++) {
        const p = view.getUint32(iovs + i * 8, true);
        const n = view.getUint32(iovs + i * 8 + 4, true);
        sink.push(bytes.slice(p, p + n));
        total += n;
      }
      view.setUint32(nwritten, total, true);
      return ESUCCESS;
    },
    proc_exit: (code: number) => {
      throw procExit(code);
    },
  };

  const notImplemented = () => ENOSYS;
  const ns = new Proxy(fns, {
    get: (target, name) => typeof name === "string" && name in target ? target[name] : notImplemented,
    has: () => true,
  });

  const dec = new TextDecoder();
  return {
    imports: { wasi_snapshot_preview1: ns },
    bind: (m) => {
      memory = m;
    },
    stdout: () => concat(out),
    stderr: () => concat(err),
    stdoutText: () => dec.decode(concat(out)),
    stderrText: () => dec.decode(concat(err)),
  };
};
