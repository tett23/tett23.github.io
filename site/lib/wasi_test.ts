import { assert, assertEquals, assertThrows } from "./assert.ts";
import { createWasi, ENOSYS, IMPLEMENTED, isProcExit } from "./wasi.ts";
import { readLock } from "./lock.ts";

const memory = () => new WebAssembly.Memory({ initial: 1 });

const setup = (opts: Parameters<typeof createWasi>[0] = {}) => {
  const mem = memory();
  const wasi = createWasi(opts);
  wasi.bind(mem);
  const fns = wasi.imports.wasi_snapshot_preview1 as Record<
    string,
    (...a: (number | bigint)[]) => number
  >;
  return { mem, wasi, fns };
};

const putIovecs = (mem: WebAssembly.Memory, at: number, chunks: Uint8Array[]) => {
  const view = new DataView(mem.buffer);
  const bytes = new Uint8Array(mem.buffer);
  let data = at + chunks.length * 8;
  chunks.forEach((c, i) => {
    bytes.set(c, data);
    view.setUint32(at + i * 8, data, true);
    view.setUint32(at + i * 8 + 4, c.length, true);
    data += c.length;
  });
};

Deno.test("fd_write collects stdout and stderr separately", () => {
  const { mem, wasi, fns } = setup();
  const enc = new TextEncoder();
  putIovecs(mem, 100, [enc.encode("out1 "), enc.encode("out2")]);
  assertEquals(fns.fd_write(1, 100, 2, 50), 0);
  assertEquals(new DataView(mem.buffer).getUint32(50, true), 9);
  putIovecs(mem, 300, [enc.encode("err")]);
  assertEquals(fns.fd_write(2, 300, 1, 50), 0);
  assertEquals(wasi.stdoutText(), "out1 out2");
  assertEquals(wasi.stderrText(), "err");
});

Deno.test("fd_write keeps a UTF-8 character split across iovecs", () => {
  const { mem, wasi, fns } = setup();
  const bytes = new TextEncoder().encode("漢字");
  putIovecs(mem, 100, [bytes.slice(0, 2), bytes.slice(2, 4), bytes.slice(4)]);
  fns.fd_write(1, 100, 3, 50);
  assertEquals(wasi.stdoutText(), "漢字");
  assertEquals(wasi.stdout(), bytes);
});

Deno.test("fd_write to other descriptors is EBADF", () => {
  const { mem, fns } = setup();
  putIovecs(mem, 100, [new Uint8Array([1])]);
  assertEquals(fns.fd_write(3, 100, 1, 50), 8);
});

const readCStrings = (mem: WebAssembly.Memory, ptrs: number, n: number) => {
  const view = new DataView(mem.buffer);
  const bytes = new Uint8Array(mem.buffer);
  return Array.from({ length: n }, (_, i) => {
    const p = view.getUint32(ptrs + i * 4, true);
    const end = bytes.indexOf(0, p);
    return new TextDecoder().decode(bytes.subarray(p, end));
  });
};

Deno.test("args are laid out NUL-terminated", () => {
  const { mem, fns } = setup({ args: ["prog", "引数"] });
  const view = new DataView(mem.buffer);
  assertEquals(fns.args_sizes_get(0, 4), 0);
  assertEquals(view.getUint32(0, true), 2);
  assertEquals(view.getUint32(4, true), 5 + 7);
  assertEquals(fns.args_get(100, 200), 0);
  assertEquals(readCStrings(mem, 100, 2), ["prog", "引数"]);
  assertEquals(new Uint8Array(mem.buffer)[200 + 4], 0);
});

Deno.test("environment is laid out NUL-terminated", () => {
  const { mem, fns } = setup({ env: { A: "1", LANG: "C.UTF-8" } });
  const view = new DataView(mem.buffer);
  assertEquals(fns.environ_sizes_get(0, 4), 0);
  assertEquals(view.getUint32(0, true), 2);
  assertEquals(view.getUint32(4, true), 4 + 13);
  assertEquals(fns.environ_get(100, 200), 0);
  assertEquals(readCStrings(mem, 100, 2), ["A=1", "LANG=C.UTF-8"]);
});

Deno.test("empty args and environment", () => {
  const { mem, fns } = setup();
  const view = new DataView(mem.buffer);
  fns.args_sizes_get(0, 4);
  assertEquals([view.getUint32(0, true), view.getUint32(4, true)], [0, 0]);
  fns.environ_sizes_get(0, 4);
  assertEquals([view.getUint32(0, true), view.getUint32(4, true)], [0, 0]);
});

Deno.test("clock_time_get uses the given clock", () => {
  const seen: number[] = [];
  const { mem, fns } = setup({
    now: (id) => {
      seen.push(id);
      return 1_700_000_000_123_456_789n;
    },
  });
  assertEquals(fns.clock_time_get(1, 1000n, 64), 0);
  assertEquals(new DataView(mem.buffer).getBigUint64(64, true), 1_700_000_000_123_456_789n);
  assertEquals(seen, [1]);
});

Deno.test("random_get uses the given source", () => {
  const { mem, fns } = setup({ random: (b) => b.fill(7) });
  assertEquals(fns.random_get(10, 4), 0);
  assertEquals(Array.from(new Uint8Array(mem.buffer, 9, 6)), [0, 7, 7, 7, 7, 0]);
});

Deno.test("random_get defaults to crypto for large buffers", () => {
  const mem = new WebAssembly.Memory({ initial: 2 });
  const wasi = createWasi({});
  wasi.bind(mem);
  const fns = wasi.imports.wasi_snapshot_preview1 as Record<string, (...a: number[]) => number>;
  assertEquals(fns.random_get(0, 100_000), 0);
  assert(new Uint8Array(mem.buffer, 0, 100_000).some((b) => b !== 0));
});

Deno.test("proc_exit throws with the exit code", () => {
  const { fns } = setup();
  const e = assertThrows(() => fns.proc_exit(3));
  assert(isProcExit(e));
  assertEquals(e.exitCode, 3);
  assert(!isProcExit(new Error("x")));
});

Deno.test("functions that are not implemented return ENOSYS", () => {
  const { fns } = setup();
  assertEquals(ENOSYS, 52);
  for (const name of ["fd_read", "path_open", "fd_close", "poll_oneoff"]) {
    assertEquals(fns[name](0, 0, 0), ENOSYS);
  }
});

Deno.test("the implemented set", () => {
  assertEquals([...IMPLEMENTED].sort(), [
    "args_get",
    "args_sizes_get",
    "clock_time_get",
    "environ_get",
    "environ_sizes_get",
    "fd_write",
    "proc_exit",
    "random_get",
  ]);
});

Deno.test("every product wasm imports only what is implemented", async () => {
  const assets = Deno.env.get("ASSETS_DIR") ?? new URL("../../_assets/", import.meta.url).pathname;
  const lock = readLock(await Deno.readTextFile(new URL("../wasm.lock", import.meta.url)));
  const wasms = lock.filter((e) => e.name.endsWith(".wasm"));
  assert(wasms.length > 0);
  for (const { name } of wasms) {
    const mod = new WebAssembly.Module(await Deno.readFile(`${assets}/${name}`));
    for (const imp of WebAssembly.Module.imports(mod)) {
      assertEquals(imp.module, "wasi_snapshot_preview1", `${name}: ${imp.module}.${imp.name}`);
      assert(IMPLEMENTED.has(imp.name), `${name} imports ${imp.name}`);
    }
  }
});
