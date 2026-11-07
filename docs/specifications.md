# 仕様

tett23.github.io（`https://tett23.github.io/`）の現行の仕様をまとめる。

ページについての決定は、ページを [tett23/tett23](https://github.com/tett23/tett23) に置いていたときの ADR（tett23/tett23 の `.github/docs/adr/`）と、このリポジトリの `docs/adr/` に記録する。

## 基盤

[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) の基盤で、プロダクトのページを公開する。[tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md) で、このリポジトリ（ユーザーサイト）に移した。

- 公開先は `https://tett23.github.io/` で、目次のページを置く。各ページは `nablaskk/`、`peg-hs/`、`golem/` の下に置く。
- ソースは `site/` に置く。フレームワークと npm の依存は使わず、HTML と CSS は手で書き、スクリプトは TypeScript（クラスを使わない）で書く。
- Deno の設定は `deno.json` にある。`deno task check`、`deno lint`、`deno fmt --check`、`deno task test` で検査する。
- `site/wasm.lock` に、取り込む wasm とデータのファイルを 1 行に 1 つ、`名前 URL SHA-256` で書く。`scripts/fetch-assets.sh` が取ってきて SHA-256 を確かめ、合わなければ失敗してファイルを残さない。取ってきたファイル（`_assets/`）はコミットしない。
- `scripts/build-site.sh` が `_site/` を組み立てる。各ページの `main.ts` と `worker.ts` を `deno bundle` で 1 つの JS にし、`wasm.lock` のファイルを `_site/assets/` に置く。
- `scripts/check-site.ts` が、組み立てた `_site/` の同じサイトの参照先がすべてあることと、外部のオリジンからスクリプト、スタイルシート、フォントを読み込んでいないことを確かめる。
- GHC の wasm のために、WASI preview1 のうち引数、環境変数、時計、乱数、標準出力と標準エラーへの書き込み、`proc_exit` だけを `site/lib/wasi.ts` に実装する。ほかの関数は `ENOSYS` を返す。`wasm.lock` の wasm の import がこの範囲に収まることをテストで確かめる。
- CI の `site` ジョブが、取り込み、検査、テスト、組み立て、組み立てたサイトの検査を行う。main への push では、`deploy` ジョブが `_site/` を GitHub Pages にデプロイする。

## NablaSKK のページ

`https://tett23.github.io/nablaskk/` に、NablaSKK の紹介ページを日本語で置く（[tett23/tett23 の ADR 0003](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0003-nablaskk-page.md)、[tett23/tett23 の ADR 0007](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0007-nablaskk-page-test-design-fixes.md)）。

- 節は、ヒーロー（「言語の自由をとりもどそう」）、試す、キーを自分で決める、設定アプリ、なぜ SKK か、AquaSKK との違い、インストールの順に並ぶ。色は白の地にアイコンの紺と金で、見出しは明朝。
- 「試す」は、NablaSKK のリリースの `nablaskk.wasm` と `SKK-JISYO.S` を読み込み、入力欄のキーイベントをエンジンに渡す。キーの値は NablaSKK の `KeyTranslator.swift` と同じにする。エンジンが使ったキーだけ `preventDefault` し、使わなかったキーは普通の入力欄として扱う（Tab はフォーカスを移す）。
- 最初の 4 つの候補は入力欄の中に ▼ つきで出し、候補の一覧は `candidates.visible` が真のときだけ出す。注釈は `annotation` が null でないときだけ出す。単語登録は入力欄の中に出し、登録した語はメモリの上だけに置く。
- 入力欄の横の欄でローマ字かなルールを足すと、すぐに反映し、行ごとに反映したか、反映しない理由を出す。初期値は `fj,、,、,､`。
- OS の日本語入力がオンのときは警告を出し、物理キーボードのない端末では試せないことを出す。
- 設定アプリの 6 ページのスクリーンショットを、タブと前後のボタンと左右の矢印キーで切りかえる。自動では送らない。スクリプトがなければ横にスクロールして見られる。撮り方は `site/nablaskk/screenshots/README.md` にある。
- AquaSKK との比較の表は、AquaSKK 4.7.3 の設定アプリで確かめたことだけを書く。

## peg-hs のページ

`https://tett23.github.io/peg-hs/` に、peg-hs のページを英語で置く（[tett23/tett23 の ADR 0004](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0004-peg-hs-page.md)）。

- 節は、ヒーロー（左再帰）、3 つの柱、電卓の文法の 2 つの書き方、考え方と先行ソフトウェアとの比較、適合性、プレイグラウンド、インストールの順に並ぶ。
- プレイグラウンドは、peg-hs のリリースの `peg-hs.wasm` を Web Worker で動かす。文法を書きかえてから 300 ミリ秒たったら `analyze` を呼び、文法の AST（たためる木）、生成したモジュール、生成した型をタブで切りかえて表示する。位置を持たない AST のノードは、近い祖先の位置を使う。
- 診断は行と列つきで並べ、押すと文法の欄のその位置に移る。peg-hs の列はコードポイントで数えるので、UTF-16 の位置に直す。
- サンプルは、`JsonGenerated.hpeg`（既定）、`Json.hpeg`、README の電卓の文法で、`peg-hs.wasm` と同じタグからコピーし、`site/peg-hs/samples/README.md` に出どころを書く。
- *Format* は `format` の結果で文法の欄を置きかえる。*Copy share link* は、文法を deflate で縮めて base64url にし、URL のフラグメント `#g=` に入れたリンクをコピーする。壊れたフラグメントのときは、既定のサンプルを表示し、壊れていたことを伝える。
- 入力のテキストは解析しない。

## ADR の検査

- コミット済みの ADR の変更は、[adr-guard](https://github.com/tett23/adr-guard) で拒否する。pre-commit hook（`.githooks/pre-commit`）は `adr-guard pre-commit --allow-status --allow-links` を実行する。
- CI の `adr` ジョブは adr-guard v0.10.0 の action を使う。
- 文書の中の、ほかのリポジトリの ADR の参照は、リンクのテキストごと外部リンクにする。

## 破棄した ADR

なし
