// The Aleph page (ADR 0002, ADR 0003). The HTML of site/ is copied to _site/ as it is.
import { assert, assertEquals } from "../lib/assert.ts";

const read = (p: string) => Deno.readTextFile(new URL(p, import.meta.url));
const html = await read("./index.html");
const readme = await read("./screenshots/README.md");

Deno.test("the page is Japanese", () => {
  assertEquals(html.match(/<html[^>]*\blang="([^"]+)"/)?.[1], "ja");
});

Deno.test("the carousel has the four screens, each with an alt that is not empty", () => {
  const imgs = [...html.matchAll(/<img\b[^>]*\bsrc="screenshots\/([a-z]+)\.png"[^>]*>/g)];
  const slides = imgs.filter((m) => !/\bdata-thumb\b/.test(m[0]));
  assertEquals(slides.map((m) => m[1]), ["editor", "preview", "plot", "settings"]);
  for (const m of slides) {
    const alt = m[0].match(/\balt="([^"]*)"/)?.[1] ?? "";
    assert(alt.trim() !== "", `${m[1]}.png has no alt`);
  }
});

Deno.test("every Aleph release link is of one tag, the tag of the screenshots' README", () => {
  const tags = new Set([...html.matchAll(/tett23\/aleph\/releases\/(?:tag|download)\/([^/"]+)/g)].map((m) => m[1]));
  assertEquals(tags.size, 1, [...tags].join(", "));
  const [tag] = tags;
  assert(readme.includes(`Aleph ${tag}`), `the README does not name Aleph ${tag}`);
  for (const f of [`Aleph-${tag}-aarch64-macos.zip`, "SHA256SUMS"]) {
    assert(html.includes(`https://github.com/tett23/aleph/releases/download/${tag}/${f}`), f);
  }
});

Deno.test("the install section has the xattr step", () => {
  const at = html.indexOf('id="install"');
  assert(at >= 0);
  assert(html.slice(at).includes("xattr -dr com.apple.quarantine /Applications/Aleph.app"));
});

Deno.test("the page links to the Golem page", () => {
  assert(html.includes('href="../golem/"'));
});
