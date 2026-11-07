import { assertEquals } from "../site/lib/assert.ts";
import { checkSite } from "./check-site.ts";

const site = async (files: Record<string, string>) => {
  const dir = await Deno.makeTempDir();
  for (const [path, body] of Object.entries(files)) {
    await Deno.mkdir(`${dir}/${path}`.replace(/\/[^/]*$/, ""), { recursive: true });
    await Deno.writeTextFile(`${dir}/${path}`, body);
  }
  return dir;
};

Deno.test("a site whose references all resolve passes", async () => {
  const dir = await site({
    "index.html": `<link rel="stylesheet" href="base.css"><a href="a/">a</a><a href="https://github.com/x">gh</a>
      <a href="#top">top</a><a href="mailto:x@example.com">m</a><img src="data:image/png;base64,AA">`,
    "base.css": `@font-face{src:url("fonts/x.woff2")} body{background:url(#a)}`,
    "fonts/x.woff2": "",
    "a/index.html": `<script type="module" src="./main.js?v=1"></script><a href="../index.html#x">up</a>
      <a href="/a/">self</a><img src="/a/main.js">`,
    "a/main.js": "",
  });
  assertEquals(await checkSite(dir), []);
});

Deno.test("missing internal references are reported", async () => {
  const dir = await site({
    "index.html": `<a href="b/">b</a><img src='x.png'><a href="/tett23/a/">old base</a>`,
    "a/index.html": "",
    "s.css": `.x{background:url(y.png)}`,
  });
  assertEquals((await checkSite(dir)).sort(), [
    "index.html: missing /tett23/a/",
    "index.html: missing b/",
    "index.html: missing x.png",
    "s.css: missing y.png",
  ]);
});

Deno.test("external scripts, stylesheets and fonts are reported", async () => {
  const dir = await site({
    "index.html": `<script src="https://cdn.example/x.js"></script>
      <link rel="stylesheet" href="//fonts.example/css">
      <link rel="preload" as="font" href="https://fonts.example/f.woff2">`,
    "s.css": `@import url("https://e/x.css"); @font-face{src:url(https://e/f.woff2)}`,
  });
  assertEquals((await checkSite(dir)).sort(), [
    "index.html: external //fonts.example/css",
    "index.html: external https://cdn.example/x.js",
    "index.html: external https://fonts.example/f.woff2",
    "s.css: external https://e/f.woff2",
    "s.css: external https://e/x.css",
  ]);
});
