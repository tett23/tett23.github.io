# 仕様

tett23.github.io（`https://tett23.github.io/`）の現行の仕様をまとめる。

ページについての決定は、ページを [tett23/tett23](https://github.com/tett23/tett23) に置いていたときの ADR（tett23/tett23 の `.github/docs/adr/`）と、このリポジトリの `docs/adr/` に記録する。

## 基盤

[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) の基盤で、プロダクトのページを公開する。[tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md) で、このリポジトリ（ユーザーサイト）に移した。

- 公開先は `https://tett23.github.io/` で、目次のページを置く。各ページは `nablaskk/`、`peg-hs/`、`golem/`（英語版は `golem/en/`）、`aleph/` の下に置く。
- ソースは `site/` に置く。フレームワークと npm の依存は使わず、HTML と CSS は手で書き、スクリプトは TypeScript（クラスを使わない）で書く。
- Deno の設定は `deno.json` にある。`deno task check`、`deno lint`、`deno fmt --check`、`deno task test` で検査する。
- `site/wasm.lock` に、取り込む wasm とデータのファイルを 1 行に 1 つ、`名前 URL SHA-256` で書く。`scripts/fetch-assets.sh` が取ってきて SHA-256 を確かめ、合わなければ失敗してファイルを残さない。取ってきたファイル（`_assets/`）はコミットしない。
- 4 つめの欄にパスを書いた行は、URL の tar.gz のアーカイブから、そのパスのファイルだけを取り出して `名前` で置く。SHA-256 は取り出したファイルのものである。アーカイブにそのパスがないとき、読めないとき、SHA-256 が合わないときは、失敗してファイルを残さない（[ADR 0003](adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)）。リリースの `SHA256SUMS` と照らすには、アーカイブを取ってきて `SHA256SUMS` で確かめ、取り出したファイルの SHA-256 を計算して `wasm.lock` に書く。
- `scripts/build-site.sh` が `_site/` を組み立てる。各ページの `main.ts` と `worker.ts` を `deno bundle` で 1 つの JS にし、`wasm.lock` のファイルを `_site/assets/` に置く。
- `scripts/check-site.ts` が、組み立てた `_site/` の同じサイトの参照先がすべてあることと、外部のオリジンからスクリプト、スタイルシート、フォントを読み込んでいないことを確かめる。`<link rel="alternate">` と `<link rel="canonical">` は、ページを名指すだけで読み込まないので、外部のオリジンを指してよい（[ADR 0001](adr/0001-golem-page-in-japanese-and-english.md)）。
- GHC の wasm のために、WASI preview1 のうち引数、環境変数、時計、乱数、標準出力と標準エラーへの書き込み、`proc_exit` だけを `site/lib/wasi.ts` に実装する。ほかの関数は `ENOSYS` を返す。`wasm.lock` の wasm の import がこの範囲に収まることをテストで確かめる。
- ただし `golem.wasm` は、ファイルの関数も import する。ディレクトリを渡さないので、それらは呼ばれない。`golem.wasm` については、import が `wasi_snapshot_preview1` だけであることと、サンプルを組むあいだ実装していない関数が呼ばれないことを、テストで確かめる（[ADR 0003](adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)）。
- CI の `site` ジョブが、取り込み、検査、テスト、組み立て、組み立てたサイトの検査を行う。main への push では、`deploy` ジョブが `_site/` を GitHub Pages にデプロイする。

## NablaSKK のページ

`https://tett23.github.io/nablaskk/` に、NablaSKK の紹介ページを日本語で置く（[tett23/tett23 の ADR 0003](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0003-nablaskk-page.md)、[tett23/tett23 の ADR 0007](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0007-nablaskk-page-test-design-fixes.md)）。

- 節は、ヒーロー（「言語の自由をとりもどそう」）、試す、キーを自分で決める、設定アプリ、なぜ SKK か、AquaSKK との違い、インストールの順に並ぶ。色は白の地にアイコンの紺と金で、見出しは明朝。
- 「試す」は、NablaSKK のリリースの `nablaskk.wasm` と `SKK-JISYO.S` を読み込み、入力欄のキーイベントをエンジンに渡す。キーの値は NablaSKK の `KeyTranslator.swift` と同じにする。エンジンが使ったキーだけ `preventDefault` し、使わなかったキーは普通の入力欄として扱う（Tab はフォーカスを移す）。
- 最初の 4 つの候補は入力欄の中に ▼ つきで出し、候補の一覧は `candidates.visible` が真のときだけ出す。注釈は `annotation` が null でないときだけ出す。単語登録は入力欄の中に出し、登録した語はメモリの上だけに置く。
- 入力欄の横の欄でローマ字かなルールを足すと、すぐに反映し、行ごとに反映したか、反映しない理由を出す。初期値は `fj,、,、,､`。
- OS の日本語入力がオンのときは警告を出し、物理キーボードのない端末では試せないことを出す。
- 設定アプリの 6 ページのスクリーンショットを、タブと前後のボタンと左右の矢印キーで切りかえる（`site/lib/carousel.ts`）。自動では送らない。スクリプトがなければ横にスクロールして見られる。撮り方は `site/nablaskk/screenshots/README.md` にある。
- AquaSKK との比較の表は、AquaSKK 4.7.3 の設定アプリで確かめたことだけを書く。

## peg-hs のページ

`https://tett23.github.io/peg-hs/` に、peg-hs のページを英語で置く（[tett23/tett23 の ADR 0004](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0004-peg-hs-page.md)）。

- 節は、ヒーロー（左再帰）、3 つの柱、電卓の文法の 2 つの書き方、考え方と先行ソフトウェアとの比較、適合性、プレイグラウンド、インストールの順に並ぶ。
- プレイグラウンドは、peg-hs のリリースの `peg-hs.wasm` を Web Worker で動かす。文法を書きかえてから 300 ミリ秒たったら `analyze` を呼び、文法の AST（たためる木）、生成したモジュール、生成した型をタブで切りかえて表示する。位置を持たない AST のノードは、近い祖先の位置を使う。
- 診断は行と列つきで並べ、押すと文法の欄のその位置に移る。peg-hs の列はコードポイントで数えるので、UTF-16 の位置に直す。
- サンプルは、`JsonGenerated.hpeg`（既定）、`Json.hpeg`、README の電卓の文法で、`peg-hs.wasm` と同じタグからコピーし、`site/peg-hs/samples/README.md` に出どころを書く。
- *Format* は `format` の結果で文法の欄を置きかえる。*Copy share link* は、文法を deflate で縮めて base64url にし、URL のフラグメント `#g=` に入れたリンクをコピーする。壊れたフラグメントのときは、既定のサンプルを表示し、壊れていたことを伝える。
- 入力のテキストは解析しない。

## Golem のページ

`https://tett23.github.io/golem/` に日本語版を、`https://tett23.github.io/golem/en/` に英語版を置く（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)、[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md)、[ADR 0001](adr/0001-golem-page-in-japanese-and-english.md)、[ADR 0003](adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)）。

- 2 つのページは同じ節を同じ順に並べる。節は、標語（縦組みの「組版をソフトウェアに」と "Typesetting, as software."、インストールとマニュアルへのリンク）、試す、四つの原則、拡張、TeX と InDesign との比較、マニュアル、関連プロジェクト、インストールである。各ページは両方の言語の `hreflang` の `alternate` と、もう一方の言語へのリンクを持つ。言語の自動の振り分けはしない。
- 色は白の地、黒の文字、強調の藍（#1f4e9c）で、黒の地の上では明るい藍（#9fb6e0）を使う。プレビューの背景は灰色（#4a4a4a）である。
- 取り込む版は Golem v0.1.0-rc4 と shem v0.1.0-rc7 である。マニュアルとリリースへのリンク、フォントとそのライセンスは、`wasm.lock` の `golem.wasm` と同じタグにそろえる。
- 試す欄は、`kumo-no-ito.gm` と `style.toml` をタブで切りかえて書きかえられる。`manifest.toml` は `site/golem/sample/manifest.toml` に固定する。原稿の命令の部分は、テキストエリアの後ろに重ねた `pre` で藍にする。
- 書きかえてから 500 ミリ秒たったら、Worker の中で `golem.wasm` の `golem_build_pdf` に `manifest.toml`、`style.toml`、`kumo-no-ito.gm`、`fonts/NotoSerifJP-Regular.otf` を渡して組む。組むのは一度に一つで、組んでいる途中の書きかえの結果は捨て、最後の書きかえだけを組む。
- 組んだ PDF は shem の wasm で 300 dpi で開き、表示している見開きのページだけをラスタライズする。描いたページの `ImageBitmap` は次に組み直すまで残し、組み直したら `close()` する。
- 各ページは、表示する幅に画面の倍率を掛けた大きさのキャンバスに、`imageSmoothingQuality = "high"` で縮めて描く。枠の幅が変わったら描き直す。プレビューは試す欄の横幅の 3 分の 2 を使い、見開きの 2 ページで枠の幅を埋める。
- 見開きは右綴じで、1 ページめは最初の見開きの左に一人で置き、その後は右に偶数のページ、左に次の奇数のページを置く。ページ送りのボタン、ページの番号、PDF のダウンロードのボタンを置く。各ページの画像には「8 ページ中 1 ページめ」（英語版は "Page 1 of 8"）の名前を付ける。
- 診断は原稿の欄の上に行と列つきで出し、`kumo-no-ito.gm` か `style.toml` の診断を押すと、そのタブのその位置に移る。PDF が組めなかったときは、最後に組めたプレビューを残す。
- プレビューの下に、組版の時間と、表示した見開きのラスタライズの時間（残しておいたページは 0）を出す。
- `golem.wasm` をコンパイルできないブラウザでは、Chrome 137、Firefox 131、Safari 18.4 以降で開くよう伝える。
- スクリプトが出す文言は `site/golem/strings.ts` の言語ごとの表にあり、`document.documentElement.lang` で選ぶ。
- サンプルは芥川龍之介「蜘蛛の糸」（青空文庫）を Golem の `convertAozora` で変え、外字の「犍」を手で入れたもので、作り方は `site/golem/sample/README.md` にある。`style.toml` は Golem の『蟹工船』のフィクスチャーと同じ B6 の縦組み、42 字 16 行である。
- 時間の記録は `docs/perf/` にある。

## Aleph のページ

`https://tett23.github.io/aleph/` に、Aleph の紹介ページを日本語で置く（[ADR 0002](adr/0002-aleph-page.md)、[ADR 0003](adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)、[ADR 0004](adr/0004-aleph-page-for-v1-0-0-rc3.md)）。

- 「本と PDF をつくることに特化した執筆・組版環境」と説明し、ヒーローにアイコンと「無限の可能性。自由に、本をつくろう。」を置く。
- 節は、ヒーロー、画面、機能の一覧（13 項目）、Golem との関係、インストール、締めの順に並ぶ。色はアイコンの黒（#141416）と白（#f2efe8）に、強調にアプリのダークの外観の黄色（#c9a862）を使う。
- 画面のカルーセルは、エディタ、ページのプレビュー、プロット、設定の 4 枚で、NablaSKK のページと同じ `site/lib/carousel.ts` で動かす。撮り方は `site/aleph/screenshots/README.md` にある。
- リンクする版は Aleph v1.0.0-rc3 で、ページの中のリリースへのリンクとスクリーンショットの README の版をそろえる。インストールの節に、公証を受けていないための `xattr -dr com.apple.quarantine /Applications/Aleph.app` の手順を書く。
- アイコン（`site/aleph/icon.svg`）は Aleph の v1.0.0-rc2 のタグの `public/icon.svg` を写したもの（v1.0.0-rc3 でも同じ）で、ファビコンにも使う。

## ADR の検査

- コミット済みの ADR の変更は、[adr-guard](https://github.com/tett23/adr-guard) で拒否する。pre-commit hook（`.githooks/pre-commit`）は `adr-guard pre-commit --allow-status --allow-links` を実行する。
- CI の `adr` ジョブは adr-guard v0.10.0 の action を使う。
- 文書の中の、ほかのリポジトリの ADR の参照は、リンクのテキストごと外部リンクにする。

## 破棄した ADR

なし
