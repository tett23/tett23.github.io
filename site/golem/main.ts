// The Golem playground (tett23/tett23 ADR 0005, ADR 0006, ADR 0001, ADR 0003). The same script runs
// on golem/ and golem/en/; the strings follow the lang of the document.

import { client } from "../lib/rpc.ts";
import { offsetOf } from "../peg-hs/position.ts";
import type { Diagnostic } from "./frame.ts";
import { SOURCE, STYLE } from "./golem.ts";
import { highlight } from "./highlight.ts";
import { fitCanvas } from "./fit.ts";
import { createPreview, type View } from "./preview.ts";
import { createScheduler } from "./schedule.ts";
import { stringsFor } from "./strings.ts";
import type { Built, Rendered, Request, Response } from "./worker.ts";

const S = stringsFor(document.documentElement.lang);
const root = document.querySelector<HTMLElement>("[data-playground]");

const el = (tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
};

const mount = async (root: HTMLElement) => {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const editors = new Map(
    [SOURCE, STYLE].map((f) => [f, {
      area: $<HTMLTextAreaElement>(`[data-editor="${f}"]`),
      hl: $<HTMLPreElement>(`[data-highlight="${f}"]`),
    }]),
  );
  const diags = $("[data-diagnostics]");
  const status = $("[data-status]");
  const label = $("[data-page-label]");
  const timing = $("[data-timing]");
  const next = $<HTMLButtonElement>("[data-next]");
  const prev = $<HTMLButtonElement>("[data-prev]");
  const download = $<HTMLButtonElement>("[data-download]");
  const canvases = {
    left: $<HTMLCanvasElement>('[data-page="left"]'),
    right: $<HTMLCanvasElement>('[data-page="right"]'),
  };

  const say = (text: string) => {
    status.textContent = text;
    status.hidden = text === "";
  };
  say(S.loading);

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
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) select((i + d + tabs.length) % tabs.length, true);
    });
  });

  const paint = (file: string) => {
    const { area, hl } = editors.get(file)!;
    hl.innerHTML = highlight(file, area.value);
    hl.scrollTop = area.scrollTop;
  };
  const load = async (file: string) => {
    const r = await fetch(new URL(`./sample/${file}`, import.meta.url));
    editors.get(file)!.area.value = await r.text();
    paint(file);
  };
  await Promise.all([load(SOURCE), load(STYLE)]);

  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  const call = client<Request, Response>(worker);

  // The preview: bitmaps of the shown spread only, closed on the next build.
  let buildId = 0;
  let rasterMs = 0;
  const paintPage = (c: HTMLCanvasElement, bitmap: ImageBitmap) => {
    const size = fitCanvas(c.clientWidth, globalThis.devicePixelRatio || 1, bitmap.width, bitmap.height);
    c.width = size.width;
    c.height = size.height;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  };
  let lastView: View<Rendered> | undefined;
  // Draw again at the new size when the frame changes its width.
  new ResizeObserver(() => {
    const v = lastView;
    if (!v) return;
    (["left", "right"] as const).forEach((side) => {
      const shown = v[side];
      if (shown) paintPage(canvases[side], shown.bitmap.bitmap);
    });
  }).observe(canvases.left.parentElement!);
  const draw = (v: View<Rendered>) => {
    (["left", "right"] as const).forEach((side) => {
      const c = canvases[side];
      const shown = v[side];
      c.hidden = !shown;
      if (!shown) return;
      paintPage(c, shown.bitmap.bitmap);
      c.setAttribute("aria-label", S.pageAlt(shown.page, pageCount));
    });
    lastView = v;
    const pages = [v.right?.page, v.left?.page].filter((p): p is number => p !== undefined);
    label.textContent = S.pageOf(Math.min(...pages), Math.max(...pages), pageCount);
    next.disabled = v.index >= v.count - 1;
    prev.disabled = v.index <= 0;
    timing.textContent = S.timing(buildMs, rasterMs);
    rasterMs = 0;
  };
  const preview = createPreview<Rendered>({
    rasterize: (page) =>
      (call({ op: "render", id: buildId, page }) as Promise<Rendered>).then((r) => (rasterMs += r.ms, r)),
    close: (r) => r.bitmap.close(),
    draw,
  });
  const quiet = (p: Promise<unknown>) => p.catch(() => {});
  next.addEventListener("click", () => quiet(preview.go(preview.index() + 1)));
  prev.addEventListener("click", () => quiet(preview.go(preview.index() - 1)));

  let pageCount = 0;
  let buildMs = 0;
  let pdf: Uint8Array<ArrayBuffer> | null = null;
  download.addEventListener("click", () => {
    if (!pdf) return;
    const a = el("a", {
      href: URL.createObjectURL(new Blob([pdf], { type: "application/pdf" })),
      download: "kumo-no-ito.pdf",
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL((a as HTMLAnchorElement).href), 1000);
  });

  // Diagnostics, with a button to the place when it is in one of the two editors.
  const goTo = (d: Diagnostic) => {
    const i = tabs.findIndex((t) => t.dataset.file === d.span?.file);
    if (i < 0 || !d.span) return;
    select(i);
    const { area } = editors.get(d.span.file)!;
    const at = offsetOf(area.value, d.span.line, d.span.column);
    area.focus();
    area.setSelectionRange(at, at);
  };
  const showDiagnostics = (list: Diagnostic[], kept: boolean) => {
    const head = el("p", { class: "count" }, list.length === 0 ? S.noDiagnostics : S.diagnostics(list.length));
    const items = list.map((d) => {
      const where = d.span ? `${d.span.file}:${d.span.line}:${d.span.column}` : "";
      const body = [
        el("span", { class: `sev ${d.severity}` }, d.severity),
        ` ${where} ${d.code} `,
        el("span", { lang: "ja" }, d.message),
      ];
      const clickable = d.span && editors.has(d.span.file);
      const row = clickable ? el("button", { type: "button" }, ...body) : el("span", {}, ...body);
      if (clickable) row.addEventListener("click", () => goTo(d));
      return el("li", {}, row);
    });
    diags.replaceChildren(
      head,
      ...(kept ? [el("p", { class: "kept" }, S.keptDiagnostic)] : []),
      el("ul", {}, ...items),
    );
  };

  const scheduler = createScheduler<{ style: string; source: string }, Built>({
    delay: 500,
    run: (input) => call({ op: "build", ...input }) as Promise<Built>,
    show: (r) => {
      buildMs = r.ms;
      if (r.status === 1) {
        diags.replaceChildren(el("p", { class: "kept" }, S.badFrame));
        return;
      }
      showDiagnostics(r.diagnostics, r.pdf === null && pageCount > 0);
      if (!r.pdf) {
        if (pageCount === 0) say(S.failed + (r.diagnostics[0]?.message ?? ""));
        return;
      }
      say("");
      pdf = r.pdf;
      download.disabled = false;
      buildId = r.id;
      pageCount = r.pageCount;
      quiet(preview.load(r.pageCount));
    },
    fail: (e) => say(S.failed + (e instanceof Error ? e.message : String(e))),
  });
  const input = () => ({ style: editors.get(STYLE)!.area.value, source: editors.get(SOURCE)!.area.value });

  editors.forEach(({ area }, file) => {
    area.addEventListener("input", () => {
      paint(file);
      scheduler.change(input());
    });
    area.addEventListener("scroll", () => (editors.get(file)!.hl.scrollTop = area.scrollTop));
  });

  try {
    await call({ op: "init" });
  } catch {
    say(S.unsupported);
    return;
  }
  say(S.building);
  scheduler.now(input());
};

if (root) mount(root);
