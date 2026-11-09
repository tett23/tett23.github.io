// The strings the playground script shows, one table per language (ADR 0001).

export type Strings = {
  loading: string;
  building: string;
  ready: string;
  unsupported: string;
  failed: string;
  badFrame: string;
  noDiagnostics: string;
  diagnostics: (n: number) => string;
  pageAlt: (n: number, total: number) => string;
  pageOf: (from: number, to: number, total: number) => string;
  timing: (build: number, raster: number) => string;
  keptDiagnostic: string;
};

const ja: Strings = {
  loading: "Golem と shem の wasm、フォントを読み込んでいます（初回は約 14 MB）…",
  building: "組んでいます…",
  ready: "組みました",
  unsupported:
    "このブラウザでは golem.wasm を動かせません。WebAssembly の例外処理に対応した Chrome 137、Firefox 131、Safari 18.4 以降で開いてください。",
  failed: "組版に失敗しました：",
  badFrame: "ページの誤りで、入力を golem.wasm に渡せませんでした。",
  noDiagnostics: "診断はありません",
  diagnostics: (n) => `診断 ${n} 件`,
  pageAlt: (n, total) => `${total} ページ中 ${n} ページめ`,
  pageOf: (from, to, total) => from === to ? `${from} / ${total} ページ` : `${from}–${to} / ${total} ページ`,
  timing: (build, raster) => `組版 ${build} ms・ラスタライズ ${raster} ms`,
  keptDiagnostic: "エラーがあるので、最後に組めたページを表示しています",
};

const en: Strings = {
  loading: "Loading the wasm of Golem and shem, and the font (about 14 MB the first time)…",
  building: "Typesetting…",
  ready: "Typeset",
  unsupported:
    "This browser cannot run golem.wasm. Open the page in Chrome 137, Firefox 131, Safari 18.4 or later, which support the exception handling of WebAssembly.",
  failed: "Typesetting failed: ",
  badFrame: "A bug of this page: the input could not be passed to golem.wasm.",
  noDiagnostics: "No diagnostics",
  diagnostics: (n) => `${n} diagnostic${n === 1 ? "" : "s"}`,
  pageAlt: (n, total) => `Page ${n} of ${total}`,
  pageOf: (from, to, total) => from === to ? `Page ${from} of ${total}` : `Pages ${from}–${to} of ${total}`,
  timing: (build, raster) => `typeset in ${build} ms · rasterized in ${raster} ms`,
  keptDiagnostic: "There are errors; showing the last pages that built",
};

export const STRINGS = { ja, en } as const;

export const stringsFor = (lang: string): Strings => lang.toLowerCase().startsWith("en") ? STRINGS.en : STRINGS.ja;
