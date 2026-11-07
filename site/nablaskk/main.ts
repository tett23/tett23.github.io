// The NablaSKK page: the 試す field and the settings app carousel.

import { mountCarousel } from "./carousel.ts";
import { type Engine, loadEngine, type RuleResult } from "./engine.ts";
import { translate } from "./keys.ts";
import { view } from "./view.ts";

const $ = <T extends HTMLElement>(root: ParentNode, sel: string) => root.querySelector<T>(sel)!;

const el = (tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
};

const asset = (name: string) => new URL(`../assets/${name}`, import.meta.url);

const fetchBytes = async (url: URL) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
};

const mountDemo = async (root: HTMLElement) => {
  const field = $(root, "[data-field]");
  const textEl = $(root, "[data-text]");
  const composingEl = $(root, "[data-composing]");
  const afterEl = $(root, "[data-after]");
  const modeEl = $(root, "[data-mode]");
  const cands = $(root, "[data-cands]");
  const annotation = $(root, "[data-annotation]");
  const warn = $(root, "[data-warn]");
  const rules = $<HTMLTextAreaElement>(root, "[data-rules] textarea");
  const results = $(root, "[data-results]");

  if (matchMedia("(hover: none) and (pointer: coarse)").matches) {
    $(root, "[data-touch]").hidden = false;
  }

  let engine: Engine;
  try {
    const [wasm, dict] = await Promise.all([
      WebAssembly.compileStreaming(fetch(asset("nablaskk.wasm"))),
      fetchBytes(asset("SKK-JISYO.S")),
    ]);
    engine = loadEngine(wasm, dict);
  } catch (e) {
    console.error(e);
    $(root, "[data-error]").hidden = false;
    return;
  }

  let text = "";

  const paint = () => {
    const s = engine.state();
    text += s.fixed;
    const v = view(s);
    textEl.textContent = text;
    composingEl.textContent = v.caret[0];
    afterEl.textContent = v.caret[1];
    modeEl.textContent = v.mode;
    cands.hidden = v.candidates === null;
    cands.replaceChildren(
      ...(v.candidates
        ? [
          ...v.candidates.items.map((c) =>
            el("span", c.selected ? { class: "on" } : {}, el("i", {}, c.label), el("b", {}, c.text))
          ),
          el("span", { class: "page" }, v.candidates.page),
        ]
        : []),
    );
    annotation.hidden = v.annotation === null;
    annotation.textContent = v.annotation ?? "";
  };

  field.addEventListener("keydown", (e) => {
    const k = translate(e);
    if (k.kind === "composing") {
      warn.hidden = false;
      return;
    }
    warn.hidden = true;
    if (k.kind === "ignore") return;
    if (engine.handle(k)) {
      e.preventDefault();
      paint();
      return;
    }
    // Keys the engine did not use: a plain text field.
    paint();
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") text = [...text].slice(0, -1).join("");
    else if (e.key === "Enter") text += "\n";
    else if (e.key.length === 1) text += e.key;
    else return;
    e.preventDefault();
    paint();
  });
  field.addEventListener("compositionstart", () => {
    warn.hidden = false;
  });

  const showResults = (rs: RuleResult[]) =>
    results.replaceChildren(
      ...rs.map((r) =>
        el(
          "li",
          r.applied ? {} : { class: "bad" },
          `${r.line} 行目 `,
          el("code", {}, r.input),
          r.applied ? "：反映しました" : `：${r.reason ?? "反映できません"}`,
        )
      ),
    );

  let timer = 0;
  const applyRules = () => {
    showResults(engine.setRules(rules.value));
    paint();
  };
  rules.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(applyRules, 200);
  });
  $(root, "[data-rules]").addEventListener("submit", (e) => e.preventDefault());
  applyRules();
};

const demo = document.querySelector<HTMLElement>("[data-demo]");
if (demo) void mountDemo(demo);
const carousel = document.querySelector<HTMLElement>("[data-carousel]");
if (carousel) mountCarousel(carousel);
