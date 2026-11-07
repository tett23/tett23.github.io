import { assert, assertEquals, assertMatch } from "../lib/assert.ts";
import { decodeGrammar, encodeGrammar, readFragment, shareUrl } from "./share.ts";

const roundTrip = async (g: string) => assertEquals(await decodeGrammar(await encodeGrammar(g)), g);

Deno.test("grammars round-trip through the share fragment", async () => {
  await roundTrip("");
  await roundTrip("Expr <- Expr '+' Term / Term\n");
  await roundTrip("# 日本語のコメント 𠮷\nS <- 'é' / '漢字'\n");
  const big = Array.from({ length: 2000 }, (_, i) => `Rule${i} <- 'x${i}' Rule${i + 1}?`).join("\n");
  assert(big.length > 50_000);
  await roundTrip(big);
});

Deno.test("the encoding is base64url without padding", async () => {
  assertMatch(await encodeGrammar("S <- 'a' / 'b' / 'c'\n".repeat(30)), /^[A-Za-z0-9_-]+$/);
});

Deno.test("a fragment with g= loads the grammar", async () => {
  const g = "%module M\nS <- 'a'\n";
  assertEquals(await readFragment(`#g=${await encodeGrammar(g)}`), { kind: "grammar", grammar: g });
});

Deno.test("no fragment, or another fragment, loads nothing", async () => {
  assertEquals(await readFragment(""), { kind: "none" });
  assertEquals(await readFragment("#playground"), { kind: "none" });
});

Deno.test("a broken fragment is reported", async () => {
  for (const f of ["#g=!!!", "#g=____", "#g=" + btoa("not deflate").replace(/=+$/, "")]) {
    assertEquals((await readFragment(f)).kind, "broken", f);
  }
});

Deno.test("the share URL keeps the page and replaces the fragment", async () => {
  const u = await shareUrl("https://tett23.github.io/peg-hs/#playground", "S <- 'a'\n");
  assertMatch(u, /^https:\/\/tett23\.github\.io\/peg-hs\/#g=[A-Za-z0-9_-]+$/);
});
