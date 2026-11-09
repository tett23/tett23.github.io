import { assertEquals } from "../lib/assert.ts";
import { highlight } from "./highlight.ts";

Deno.test("commands of .gm are marked; text is escaped", () => {
  assertEquals(
    highlight("kumo-no-ito.gm", "a<[ruby: 蓮 | はす]>&"),
    'a&lt;<span class="m">[ruby:</span> 蓮 <span class="m">|</span> はす<span class="m">]</span>&gt;&amp;\n',
  );
});

Deno.test("block commands and headings of .gm are marked by line", () => {
  assertEquals(
    highlight("kumo-no-ito.gm", "@nonumber\n# 一\n本文"),
    '<span class="m">@nonumber</span>\n<span class="h"># 一</span>\n本文\n',
  );
});

Deno.test("tables and comments of TOML are marked", () => {
  assertEquals(
    highlight("style.toml", '[page]\nsize = "B6" # B6\n# note'),
    '<span class="m">[page]</span>\nsize = "B6" <span class="c"># B6</span>\n<span class="c"># note</span>\n',
  );
});
