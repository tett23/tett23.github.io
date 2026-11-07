// The peg-hs playground (ADR 0004).

import { client } from "../lib/rpc.ts";
import type { Analysis, Diagnostic, Formatted } from "./peghs.ts";
import { offsetOf } from "./position.ts";
import { readFragment, shareUrl } from "./share.ts";
import { toTree, type TreeNode } from "./tree.ts";
import type { Request, Response } from "./worker.ts";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const el = (tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
};

const SAMPLES: Record<string, string> = {
  "json-generated": "samples/json-generated.hpeg",
  "json-typed": "samples/json-typed.hpeg",
  calculator: "samples/calculator.hpeg",
};

const mount = async () => {
  const editor = $<HTMLTextAreaElement>("[data-editor]");
  const sample = $<HTMLSelectElement>("[data-sample]");
  const status = $("[data-status]");
  const diags = $("[data-diagnostics]");
  const notice = $("[data-notice]");
  const tabs = [...document.querySelectorAll<HTMLButtonElement>("[data-out] [role=tab]")];
  const panels = {
    ast: $("[data-panel=ast]"),
    module: $("[data-panel=module]"),
    types: $("[data-panel=types]"),
  };

  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  const call = client<Request, Response>(worker);

  const loadSample = async (name: string) => {
    const r = await fetch(new URL(SAMPLES[name], location.href));
    editor.value = await r.text();
  };

  const showNotice = (text: string) => {
    notice.textContent = text;
    notice.hidden = text === "";
  };

  // Tabs (WAI-ARIA tabs with automatic activation).
  const select = (i: number, focus = false) => {
    tabs.forEach((t, j) => {
      t.setAttribute("aria-selected", String(i === j));
      t.tabIndex = i === j ? 0 : -1;
      $(`#${t.getAttribute("aria-controls")}`).hidden = i !== j;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      const n = tabs.length;
      const to = e.key === "ArrowRight"
        ? (i + 1) % n
        : e.key === "ArrowLeft"
        ? (i - 1 + n) % n
        : e.key === "Home"
        ? 0
        : e.key === "End"
        ? n - 1
        : -1;
      if (to >= 0) {
        e.preventDefault();
        select(to, true);
      }
    });
  });

  const goTo = (d: Diagnostic) => {
    const at = offsetOf(editor.value, d.line, d.column);
    editor.focus();
    editor.setSelectionRange(at, at);
    // Bring the line into view: about the line's share of the height.
    const lines = editor.value.split("\n").length;
    editor.scrollTop = Math.max(0, (d.line - 3) / lines * editor.scrollHeight);
  };

  const renderTree = (t: TreeNode, level: number): HTMLElement => {
    const label = el("span", {}, t.label, " ", el("small", {}, `${t.line}:${t.column}`));
    if (t.children.length === 0) return el("li", {}, label);
    const details = el("details", level < 2 ? { open: "" } : {}, el("summary", {}, label));
    details.append(el("ul", {}, ...t.children.map((c) => renderTree(c, level + 1))));
    return el("li", {}, details);
  };

  const renderDiagnostics = (ds: Diagnostic[]) => {
    diags.replaceChildren(
      ...ds.map((d) => {
        const b = el(
          "button",
          { type: "button", class: d.severity },
          el("b", {}, `${d.line}:${d.column}`),
          ` ${d.severity}: ${d.message}`,
        );
        b.addEventListener("click", () => goTo(d));
        return el("li", {}, b);
      }),
    );
  };

  const render = (a: Analysis) => {
    const errors = a.diagnostics.filter((d) => d.severity === "error").length;
    const warnings = a.diagnostics.length - errors;
    status.textContent = errors === 0 && warnings === 0 ? "No diagnostics" : [
      errors && `${errors} error${errors > 1 ? "s" : ""}`,
      warnings && `${warnings} warning${warnings > 1 ? "s" : ""}`,
    ]
      .filter(Boolean).join(", ");
    status.className = errors > 0 ? "status bad" : "status ok";
    renderDiagnostics(a.diagnostics);
    panels.ast.replaceChildren(
      a.ast
        ? el("ul", { class: "tree" }, renderTree(toTree(a.ast), 0))
        : el("p", { class: "empty" }, "No AST: the grammar does not parse."),
    );
    panels.module.replaceChildren(
      a.module !== null
        ? el("pre", {}, a.module)
        : el("p", { class: "empty" }, "No module while the grammar has errors."),
    );
    panels.types.replaceChildren(
      a.types === null
        ? el("p", { class: "empty" }, "No types: templates could not be expanded.")
        : a.types === ""
        ? el("p", { class: "empty" }, "No generated types: every rule has a type annotation or a single value.")
        : el("pre", {}, a.types),
    );
  };

  let seq = 0;
  const analyze = async () => {
    const mine = ++seq;
    status.textContent = "Analyzing…";
    status.className = "status";
    try {
      const a = await call({ op: "analyze", grammar: editor.value }) as Analysis;
      if (mine === seq) render(a);
    } catch (e) {
      if (mine === seq) {
        status.textContent = `The generator failed: ${e instanceof Error ? e.message : e}`;
        status.className = "status bad";
      }
    }
  };

  let timer = 0;
  editor.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(analyze, 300);
  });

  sample.addEventListener("change", async () => {
    await loadSample(sample.value);
    showNotice("");
    void analyze();
  });

  $("[data-format]").addEventListener("click", async () => {
    const f = await call({ op: "format", grammar: editor.value }) as Formatted;
    if (f.text === null) {
      renderDiagnostics(f.diagnostics);
      showNotice("Format needs a grammar without syntax errors.");
      return;
    }
    showNotice("");
    editor.value = f.text;
    void analyze();
  });

  $("[data-share]").addEventListener("click", async () => {
    const url = await shareUrl(location.href, editor.value);
    history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      showNotice("Copied a link to this grammar. The grammar is in the URL fragment, which is not sent to the server.");
    } catch {
      showNotice("Could not copy. The link is now in the address bar.");
    }
  });

  const fragment = await readFragment(location.hash);
  if (fragment.kind === "grammar") {
    editor.value = fragment.grammar;
    sample.value = "";
    showNotice("Loaded the grammar from the link.");
  } else {
    await loadSample("json-generated");
    if (fragment.kind === "broken") {
      showNotice("The grammar in the link is broken, so the default sample is shown instead.");
    }
  }
  select(2);
  void analyze();
};

void mount();
