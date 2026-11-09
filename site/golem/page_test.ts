// The two Golem pages (ADR 0001, ADR 0003, ADR 0005). The HTML of site/ is copied to _site/ as it is.
import { assert, assertEquals } from "../lib/assert.ts";
import { readLock } from "../lib/lock.ts";

const read = (p: string) => Deno.readTextFile(new URL(p, import.meta.url));
const ja = await read("./index.html");
const en = await read("./en/index.html");
const lock = readLock(await read("../wasm.lock"));

const langOf = (html: string) => html.match(/<html[^>]*\blang="([^"]+)"/)?.[1];
const sectionIds = (html: string) => [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
const sectionCount = (html: string) => [...html.matchAll(/<section\b/g)].length;
const section = (html: string, id: string) => {
  const at = html.indexOf(`id="${id}"`);
  assert(at >= 0, `no section ${id}`);
  return html.slice(at, html.indexOf("</section>", at));
};

Deno.test("golem/ is Japanese and golem/en/ is English", () => {
  assertEquals(langOf(ja), "ja");
  assertEquals(langOf(en), "en");
});

Deno.test("the two pages have the same sections in the same order", () => {
  assertEquals(sectionCount(ja), sectionCount(en));
  assertEquals(sectionIds(ja), sectionIds(en));
  assert(sectionIds(ja).length >= 8);
});

Deno.test("each page has both hreflang alternates and links to the other language", () => {
  for (const html of [ja, en]) {
    assert(/<link rel="alternate" hreflang="ja" href="https:\/\/tett23\.github\.io\/golem\/">/.test(html));
    assert(/<link rel="alternate" hreflang="en" href="https:\/\/tett23\.github\.io\/golem\/en\/">/.test(html));
  }
  assert(/<a [^>]*href="en\/"[^>]*>English<\/a>/.test(ja));
  assert(/<a [^>]*href="\.\.\/"[^>]*>日本語<\/a>/.test(en));
});

const golemTag = () => lock.find((e) => e.name === "golem.wasm")!.url.match(/\/download\/([^/]+)\//)![1];

Deno.test("the manual links are of the tag of golem.wasm in wasm.lock", () => {
  const tag = golemTag();
  for (const html of [ja, en]) {
    const links = [...html.matchAll(/href="([^"]*golem-(?:dev-)?manual-[^"]*)"/g)].map((m) => m[1]);
    const base = `https://github.com/tett23/golem/releases/download/${tag}/`;
    for (const f of [`golem-manual-${tag}.pdf`, `golem-dev-manual-${tag}.pdf`]) {
      assert(links.includes(base + f), `${base + f} in ${links}`);
    }
    for (const l of links) assert(l.startsWith(base), l);
  }
});

Deno.test("every Golem release link is of that tag; the font and its license come from it too", () => {
  const tag = golemTag();
  for (const html of [ja, en]) {
    for (const m of html.matchAll(/tett23\/golem\/releases\/(?:tag|download)\/([^/"]+)/g)) {
      if (m[1] !== "$TAG") assertEquals(m[1], tag);
    }
    assert(html.includes(`TAG=${tag}\n`), "TAG= in the install steps");
  }
  for (const name of ["NotoSerifJP-Regular.otf", "LICENSE-NotoSerifJP.txt"]) {
    assert(lock.find((e) => e.name === name)!.url.includes(`/tett23/golem/${tag}/`), name);
  }
});

Deno.test("the four principles name their tools", () => {
  for (const html of [ja, en]) {
    const s = section(html, "principles");
    for (const tool of ["golem build", "golem fmt", "golem check", "golem lint", "golem preflight", "shem"]) {
      assert(s.includes(tool), tool);
    }
  }
});

Deno.test("the related projects link to the Aleph and the peg-hs pages", () => {
  for (const [html, up] of [[ja, "../"], [en, "../../"]] as const) {
    const s = section(html, "related");
    assert(s.includes(`href="${up}aleph/"`), "aleph");
    assert(s.includes(`href="${up}peg-hs/"`), "peg-hs");
  }
});

Deno.test("the sample has no geta mark and its README says where it comes from", async () => {
  assert(!(await read("./sample/kumo-no-ito.gm")).includes("〓"));
  const readme = await read("./sample/README.md");
  assert(readme.includes("3b9990dc830f79346242db7f37969a1c2c7dbb7fb9abe9915e8c89c83f8628c9"));
  assert(readme.includes("〓") && readme.includes("犍"));
});

Deno.test("kumo-no-ito.gm ends with the base text, the inputter and the proofreader", async () => {
  const tail = (await read("./sample/kumo-no-ito.gm")).split("# 底本と作成者")[1] ?? "";
  for (const s of ["底本：", "入力：平山誠、野口英司", "校正：もりみつじゅんじ"]) assert(tail.includes(s), s);
});

// ADR 0005: the peg-hs card names the parsers of .gm and of Emet.
Deno.test("the peg-hs card names the parsers of .gm and of Emet", () => {
  for (const [html, href] of [[ja, "../peg-hs/"], [en, "../../peg-hs/"]]) {
    const card = html.match(new RegExp(`<a href="${href}">[\\s\\S]*?</a>`))?.[0] ?? "";
    const desc = card.match(/<span class="desc">([\s\S]*?)<\/span>/)?.[1] ?? "";
    assert(desc.includes("<code>.gm</code>"), `${href}: no .gm`);
    assert(desc.includes("Emet"), `${href}: no Emet`);
  }
});
