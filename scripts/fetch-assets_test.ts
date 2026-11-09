import { assert, assertEquals } from "../site/lib/assert.ts";

const script = new URL("./fetch-assets.sh", import.meta.url).pathname;

const sha256 = async (b: Uint8Array<ArrayBuffer>) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b)))
    .map((x) => x.toString(16).padStart(2, "0")).join("");

const run = async (lock: string, out: string) => {
  const r = await new Deno.Command("sh", { args: [script, lock, out], stderr: "piped", stdout: "piped" }).output();
  return { code: r.code, stderr: new TextDecoder().decode(r.stderr) };
};

const fixture = async () => {
  const dir = await Deno.makeTempDir();
  const body = new TextEncoder().encode("wasm bytes");
  await Deno.writeFile(`${dir}/src.bin`, body);
  return { dir, url: `file://${dir}/src.bin`, sha: await sha256(body) };
};

const exists = async (p: string) => {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
};

Deno.test("a file whose SHA-256 matches is fetched", async () => {
  const { dir, url, sha } = await fixture();
  await Deno.writeTextFile(`${dir}/wasm.lock`, `# c\n\na.wasm ${url} ${sha}\n`);
  const r = await run(`${dir}/wasm.lock`, `${dir}/out`);
  assertEquals(r.code, 0, r.stderr);
  assertEquals(await Deno.readTextFile(`${dir}/out/a.wasm`), "wasm bytes");
});

Deno.test("a mismatching SHA-256 fails and leaves no file", async () => {
  const { dir, url } = await fixture();
  await Deno.writeTextFile(`${dir}/wasm.lock`, `a.wasm ${url} ${"0".repeat(64)}\n`);
  const r = await run(`${dir}/wasm.lock`, `${dir}/out`);
  assert(r.code !== 0);
  assert(r.stderr.includes("a.wasm"), r.stderr);
  assertEquals([...Deno.readDirSync(`${dir}/out`)].map((e) => e.name), []);
});

Deno.test("a stale file with the wrong hash is replaced", async () => {
  const { dir, url, sha } = await fixture();
  await Deno.mkdir(`${dir}/out`);
  await Deno.writeTextFile(`${dir}/out/a.wasm`, "old");
  await Deno.writeTextFile(`${dir}/wasm.lock`, `a.wasm ${url} ${sha}\n`);
  assertEquals((await run(`${dir}/wasm.lock`, `${dir}/out`)).code, 0);
  assertEquals(await Deno.readTextFile(`${dir}/out/a.wasm`), "wasm bytes");
});

Deno.test("a stale file is removed when the download does not match", async () => {
  const { dir, url } = await fixture();
  await Deno.mkdir(`${dir}/out`);
  await Deno.writeTextFile(`${dir}/out/a.wasm`, "old");
  await Deno.writeTextFile(`${dir}/wasm.lock`, `a.wasm ${url} ${"0".repeat(64)}\n`);
  assert((await run(`${dir}/wasm.lock`, `${dir}/out`)).code !== 0);
  assert(!(await exists(`${dir}/out/a.wasm`)));
});

// A tar.gz with two files, made with the tar of the system (ADR 0003).
const archive = async () => {
  const dir = await Deno.makeTempDir();
  await Deno.mkdir(`${dir}/src/pkg`, { recursive: true });
  const body = new TextEncoder().encode("the module");
  await Deno.writeFile(`${dir}/src/pkg/golem.wasm`, body);
  await Deno.writeTextFile(`${dir}/src/pkg/README`, "readme");
  const r = await new Deno.Command("sh", { args: ["-c", `cd "${dir}/src" && tar -czf ../a.tar.gz pkg`] }).output();
  assertEquals(r.code, 0);
  return { dir, url: `file://${dir}/a.tar.gz`, sha: await sha256(body) };
};

Deno.test("a fourth field takes that file out of the archive, and nothing else", async () => {
  const { dir, url, sha } = await archive();
  await Deno.writeTextFile(`${dir}/wasm.lock`, `g.wasm ${url} ${sha} pkg/golem.wasm\n`);
  const r = await run(`${dir}/wasm.lock`, `${dir}/out`);
  assertEquals(r.code, 0, r.stderr);
  assertEquals(await Deno.readTextFile(`${dir}/out/g.wasm`), "the module");
  assertEquals([...Deno.readDirSync(`${dir}/out`)].map((e) => e.name), ["g.wasm"]);
});

Deno.test("a file taken out of an archive with the wrong SHA-256 fails and leaves no file", async () => {
  const { dir, url } = await archive();
  await Deno.writeTextFile(`${dir}/wasm.lock`, `g.wasm ${url} ${"0".repeat(64)} pkg/golem.wasm\n`);
  const r = await run(`${dir}/wasm.lock`, `${dir}/out`);
  assert(r.code !== 0);
  assert(r.stderr.includes("g.wasm"), r.stderr);
  assertEquals([...Deno.readDirSync(`${dir}/out`)].map((e) => e.name), []);
});

Deno.test("a path that the archive does not have fails and leaves no file", async () => {
  const { dir, url, sha } = await archive();
  await Deno.writeTextFile(`${dir}/wasm.lock`, `g.wasm ${url} ${sha} pkg/missing.wasm\n`);
  const r = await run(`${dir}/wasm.lock`, `${dir}/out`);
  assert(r.code !== 0);
  assert(r.stderr.includes("pkg/missing.wasm"), r.stderr);
  assertEquals([...Deno.readDirSync(`${dir}/out`)].map((e) => e.name), []);
});

Deno.test("a file from an archive whose SHA-256 matches is not fetched again", async () => {
  const { dir, url, sha } = await archive();
  await Deno.writeTextFile(`${dir}/wasm.lock`, `g.wasm ${url} ${sha} pkg/golem.wasm\n`);
  assertEquals((await run(`${dir}/wasm.lock`, `${dir}/out`)).code, 0);
  await Deno.remove(`${dir}/a.tar.gz`);
  const r = await run(`${dir}/wasm.lock`, `${dir}/out`);
  assertEquals(r.code, 0, r.stderr);
  assertEquals(await Deno.readTextFile(`${dir}/out/g.wasm`), "the module");
});
