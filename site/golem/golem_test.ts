// golem.wasm and shem.wasm of wasm.lock, run in Deno (tett23/tett23 ADR 0005, ADR 0006, ADR 0003).
import { assert, assertEquals } from "../lib/assert.ts";
import { loadGolem, type ProjectFiles } from "./golem.ts";
import { loadShem } from "./shem.ts";

const assets = Deno.env.get("ASSETS_DIR") ?? new URL("../../_assets/", import.meta.url).pathname;
const sample = (f: string) => Deno.readTextFile(new URL(`./sample/${f}`, import.meta.url));

const project = async (): Promise<ProjectFiles> => ({
  manifest: await sample("manifest.toml"),
  style: await sample("style.toml"),
  source: await sample("kumo-no-ito.gm"),
  font: await Deno.readFile(`${assets}/NotoSerifJP-Regular.otf`),
});

const golem = loadGolem(await WebAssembly.compile(await Deno.readFile(`${assets}/golem.wasm`)));
const shemModule = await WebAssembly.compile(await Deno.readFile(`${assets}/shem.wasm`));

const pdfPages = (pdf: Uint8Array) =>
  new TextDecoder("latin1").decode(pdf).match(/\/Type\s*\/Page(?![s\w])/g)?.length ?? 0;

Deno.test("the sample builds with no error, into a PDF, the same bytes twice", async () => {
  const g = await golem;
  const files = await project();
  const a = g.build(files);
  assert(a.status === 0);
  assertEquals(a.diagnostics.filter((d) => d.severity === "error"), []);
  assert(a.pdf !== null);
  assertEquals(new TextDecoder().decode(a.pdf.slice(0, 5)), "%PDF-");
  const b = g.build(files);
  assert(b.status === 0);
  assertEquals(b.pdf, a.pdf);
});

Deno.test("shem gives as many pages as the PDF, each B6 at 300 dpi (1512 x 2150)", async () => {
  const g = await golem;
  const r = g.build(await project());
  assert(r.status === 0 && r.pdf);
  const shem = await loadShem(shemModule);
  const doc = shem.open(r.pdf, 300);
  try {
    assertEquals(doc.pageCount, pdfPages(r.pdf));
    for (const p of [0, doc.pageCount - 1]) {
      const img = doc.render(p);
      assertEquals([img.width, img.height], [1512, 2150]);
      assertEquals(img.rgba.length, 1512 * 2150 * 4);
    }
  } finally {
    doc.close();
  }
});

Deno.test("a broken style.toml gives no PDF and a diagnostic at its line and column", async () => {
  const g = await golem;
  const files = await project();
  const r = g.build({ ...files, style: files.style.replace('size = "B6"', 'size = "B6') });
  assert(r.status === 0);
  assertEquals(r.pdf, null);
  const d = r.diagnostics.find((d) => d.severity === "error");
  assert(d, JSON.stringify(r.diagnostics));
  assertEquals(d.span?.file, "style.toml");
  assert((d.span?.line ?? 0) >= 1 && (d.span?.column ?? 0) >= 1, JSON.stringify(d));
});

Deno.test("golem.wasm is the version of the wasm.lock tag", async () => {
  const lock = await Deno.readTextFile(new URL("../wasm.lock", import.meta.url));
  const tag = lock.match(/golem\/releases\/download\/v([^/]+)\/golem-/)![1];
  assertEquals((await golem).version, tag);
});
