# Golem のプレイグラウンドの時間（2026-11-09）

[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) と [tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) のテスト設計による記録。一度書いたら変えない。

## 条件

- golem.wasm は Golem v0.1.0-rc4、shem.wasm は shem v0.1.0-rc7（[ADR 0003](../adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)）。
- サンプルは「蜘蛛の糸」（8 ページ）、B6 の縦組み、42 字 16 行、300 dpi。
- 手元の Mac（Apple Silicon）で、`_site/` を `python3 -m http.server` で配信した。
- ブラウザは Claude のデスクトップアプリの中のブラウザ（Chromium 152、`Chrome/152.0.7977.167`）。

## 結果

ページを開いてから、最初の見開きが出るまで、約 5.5 秒（golem.wasm と shem.wasm とフォントはブラウザのキャッシュにあった）。最初の組版は 10,123 ミリ秒、最初の見開き（1 ページ）のラスタライズは 435 ミリ秒だった。

その後、原稿を 5 回書きかえ、書きかえてからプレビューが変わるまでを測った（500 ミリ秒の待ちを含む）。

| 回 | 書きかえからプレビューまで | 組版 | ラスタライズ（2 ページ） |
| --- | --- | --- | --- |
| 1 | 8,093 ms | 7,246 ms | 145 ms |
| 2 | 6,626 ms | 5,780 ms | 137 ms |
| 3 | 2,269 ms | 1,582 ms | 20 ms |
| 4 | 1,417 ms | 883 ms | 22 ms |
| 5 | 1,387 ms | 856 ms | 21 ms |

同じページを別の時に開いたときは、最初の組版が 1,097 ミリ秒のこともあった。英語版を初めて開いたときは 8,053 ミリ秒だった。

最初の数回だけ遅く、その後は 1 秒を切る。ブラウザが wasm を、まず速くコンパイルして動かし、何度か呼ばれた関数を後から最適化し直すためと考えられる（確かめてはいない）。

Deno 2.9.7 で同じ golem.wasm を動かしたときは、サンプルの組版が 1 回 1 秒ほどだった（`site/golem/golem_test.ts`）。

## 測っていないこと

- Safari での時間。
- タブのメモリの使用量（Worker の中の wasm のメモリは、この方法では測れなかった）。
