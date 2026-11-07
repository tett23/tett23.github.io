// Runs the released peg-hs.wasm of wasm.lock in Deno (ADR 0004).
import { assert, assertEquals, assertMatch } from "../lib/assert.ts";
import { loadPegHs } from "./peghs.ts";
import { countNodes, depth, toTree } from "./tree.ts";
import type { AstNode } from "./peghs.ts";

const assets = Deno.env.get("ASSETS_DIR") ?? new URL("../../_assets/", import.meta.url).pathname;
const peg = await loadPegHs(new WebAssembly.Module(await Deno.readFile(`${assets}/peg-hs.wasm`)));
const sample = (name: string) => Deno.readTextFile(new URL(`./samples/${name}`, import.meta.url));

Deno.test("JsonGenerated.hpeg has no diagnostics and generates the Value type", async () => {
  const r = peg.analyze(await sample("json-generated.hpeg"));
  assertEquals(r.diagnostics, []);
  assertMatch(r.types ?? "", /^data Value\b/m);
  assert(r.module !== null && r.module.includes("module Conformance.Bench.JsonGenerated"));
});

Deno.test("the calculator keeps Expr left recursive and generates its type", async () => {
  const r = peg.analyze(await sample("calculator.hpeg"));
  assertEquals(r.diagnostics, []);
  assert((r.types ?? "").includes("data Expr = Add Expr Term | Expr2 Term"), r.types ?? "");
});

Deno.test("the typed JSON sample has no diagnostics", async () => {
  assertEquals(peg.analyze(await sample("json-typed.hpeg")).diagnostics, []);
});

Deno.test("a reference to an undefined rule is reported at its line and column", () => {
  const r = peg.analyze("%module M\n\nS <- 'a' Missing\n");
  assertEquals(r.diagnostics.map((d) => [d.severity, d.line, d.column]), [["error", 3, 10]]);
  assertMatch(r.diagnostics[0].message, /Missing/);
  assertEquals(r.module, null);
});

const nodes = (n: AstNode): number => 1 + n.children.reduce((s, c) => s + nodes(c), 0);
const nest = (n: AstNode): number => 1 + Math.max(0, ...n.children.map(nest));

Deno.test("the tree has the nodes and the nesting of the AST JSON", async () => {
  for (const name of ["calculator.hpeg", "json-generated.hpeg", "json-typed.hpeg"]) {
    const ast = peg.analyze(await sample(name)).ast;
    assert(ast !== null);
    const tree = toTree(ast);
    assertEquals(countNodes(tree), nodes(ast), name);
    assertEquals(depth(tree), nest(ast), name);
  }
});

Deno.test("nodes without a position take the nearest ancestor's", () => {
  const ast: AstNode = {
    kind: "Rule",
    line: 3,
    column: 1,
    text: "S",
    children: [{ kind: "Literal", line: null, column: null, text: "'a'", children: [] }],
  };
  const t = toTree(ast);
  assertEquals([t.children[0].line, t.children[0].column], [3, 1]);
  assertEquals(t.children[0].label, "Literal 'a'");
});

Deno.test("format is idempotent", async () => {
  for (const name of ["calculator.hpeg", "json-generated.hpeg", "json-typed.hpeg"]) {
    const once = peg.format(await sample(name));
    assert(once.text !== null, name);
    assertEquals(peg.format(once.text).text, once.text, name);
  }
});

Deno.test("format reports a syntax error with a position", () => {
  const r = peg.format("%module M\nS <- (\n");
  assertEquals(r.text, null);
  assert(r.diagnostics.length > 0 && r.diagnostics[0].line > 0);
});
