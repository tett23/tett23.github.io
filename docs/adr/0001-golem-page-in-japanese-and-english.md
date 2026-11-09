# ADR 0001: Golem のページを日本語と英語で作り、拡張、マニュアル、関連プロジェクトの節を足す

ステータス: 採択→取り込む版、wasm.lock のアーカイブの欄、WASI の検査、入力のファイル、見開きの組み方は [ADR 0003](0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)、関連プロジェクトの peg-hs の説明は [ADR 0005](0005-peg-hs-card-names-emet.md)

## 文脈

Golem のページは、[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) と [tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) で中身を決めてある。
Golem の wasm のリリースを待っており、まだ実装していない。
[tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md) で、これから先のページについての決定は、このリポジトリの ADR に書くことにした。

モックを作って作業者に見せ、次の指示を受けた。

- Golem の使い手は日本語を話す人が多くなりそうなので、日本語版も用意する。
- 関連プロジェクトとして Aleph、shem、peg-hs があることを書く。
- プラグインと関数で拡張できることを書く。
- マニュアル 2 種へのリンクを入れる。
- 強調の色を藍にする。
- 「組版をソフトウェアにする理由」の節（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) の「考え方」）では、Golem がどのように組版をソフトウェアにしているのかを厚く説明する。特に、四つの原則と、それをツールで実現できることを、説得的に書く。

強調の色は、モックでは校正の赤字から取った赤（#e60012）だった。
作業者から、赤は Adobe を思わせるという指摘があった。
Golem は InDesign と比べられる立場にあるので、Adobe の色に寄せることは避ける。
赤、朱、藍、墨一色の 4 案を並べて見せ、作業者が藍を選んだ。
Golem にはロゴがなく、色を取れる成果物は組んだページ（白い紙と黒い文字）だけである。
藍は、校正で赤と並べて使う青から取る。

[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) は、ページの多言語化をしないこと（各ページは 1 つの言語だけで書くこと）と、Golem のページを英語で作ることを決めている。
この ADR は、Golem のページについてだけ、それを変える。

調べてわかったことは次のとおり（2026-11-09 の時点）。

- 使い手のマニュアルの「はじめに」の「なぜ Golem で解決できるのか」は、Golem の約束を四つの仕組みが支えると書いている。四つは順につながっていて、どれも前の仕組みがあって初めて働く。
  - 決定性
    - 原稿、設定、フォントを一つのプロジェクトのフォルダにまとめる。フォントはプロジェクトの中のファイルからだけ読む。
    - 同じバージョンの Golem は、同じ入力から、どのコンピューターでも一バイトも違わない PDF を作る。
    - Golem の CI の `determinism` のジョブが、x86-64 と aarch64 で同じ原稿を組み、出力のバイト列の一致を確かめている。
    - 決定性を保証しているのは PDF、HTML、プレーンテキストで、EPUB はまだ保証していない。
  - バージョン管理：原稿と `style.toml` がテキストなので、Git で変更の履歴を残せる。体裁の規則も同じ履歴に並ぶ。
  - CI：変更が届くたびに本を組み、プリフライトを走らせる。Golem にはライセンスの認証がない。
  - 見た目の回帰テスト：前の PDF と新しい PDF をページごとに画像にして比べ、変わったページだけを人が見る。ページの画像を比べる機能は Golem には入っておらず、外部のツールで行う。
  - 一周するあいだに人の手が要るのは、原稿を直すところと、変わったページを確かめるところの二か所だけである。
- 四つを支える Golem のコマンドは次のとおり（README の「Usage」）。
  - `golem build`：出力を書く。`--profile prod` で入稿する PDF を作る。
  - `golem fmt`：原稿を整形する。
  - `golem check`：出力を書かずに検査する。
  - `golem lint`：lint の規則を適用する。
  - `golem preflight`：PDF を組み、書かずに入稿の前の検査をする。
  - Linux の配布物は musl で完全に静的にリンクしている。
- Golem のマニュアルは 2 つある。どちらも Golem で組んだもので、日本語で書かれている。各リリースに、PDF と HTML（tar.gz）が添付されている。
  - 使い手のマニュアル：`golem-manual-<タグ>.pdf`、`golem-manual-<タグ>-html.tar.gz`。原稿は `manual/`。
  - 開発者のマニュアル：`golem-dev-manual-<タグ>.pdf`、`golem-dev-manual-<タグ>-html.tar.gz`。原稿は `manual-dev/`。
  - 最新のリリースは v0.1.0-rc3 で、上の 4 つのファイルが添付されている。
- プラグイン（使い手のマニュアルの第 10 章）
  - WebAssembly のファイルで配る。`manifest.toml` の `[plugins.<名前>]` に HTTPS の URL を書き、`golem plugin lock` でハッシュを `plugins.lock` に書く。
  - 種類は、コマンド、ブロックコマンド、フィルタ、一覧の 4 つである。
  - Golem はプラグインに、ファイル、ネットワーク、時計、乱数を渡さない。そのため、プラグインを使っても、同じ入力から同じ出力が得られる。
- 関数
  - 関数は、Golem の関数を書く言語 Emet（`.emet`）で書き、原稿から呼ぶ。
  - Emet は 1.x のあいだ実験的な機能である。`.emet` のファイル、マニフェストの関数の設定、原稿から関数を呼ぶ書き方は、二つ目の数が上がったバージョンで使えなくなることがある（使い手のマニュアルの第 8 章）。
  - 関数が読めるファイルは、マニフェストの `[functions.requires]` に書いたものだけである。
  - 見本は `modules/golem-driver/test/fixtures/emet-samples/` にある。たとえば `fn/numbers.emet` の `yen` は、原稿の `[n.yen 1234567]` を `1,234,567円` にする。
- 関連プロジェクト
  - Aleph：Golem の原稿を書くためのデスクトップアプリ。ページは [ADR 0002](0002-aleph-page.md) で作る。
  - shem：PDF を PNG にするラスタライザ。Golem は shem を見た目の回帰テストに使っている。Golem のページのプレビューも shem の wasm で描く。
  - peg-hs：PEG の文法から Haskell のパーサを生成する。Golem の `cabal.project` は peg-hs のコミットを固定して取り込み、`.gm` のパーサを生成している。

## 実装すること

[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) と [tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) のうち、次の点だけを変える。
プレイグラウンド、サンプル、比較の表など、ほかの点はそれらの ADR のとおりにする。

### 言語と URL

- 日本語版と英語版の 2 つのページを作る。
  - `https://tett23.github.io/golem/`：日本語版（`lang="ja"`）。使い手に日本語を話す人が多いので、こちらを `golem/` に置く。
  - `https://tett23.github.io/golem/en/`：英語版（`lang="en"`）。英語のページに出る日本語には `lang="ja"` を付ける。
- 2 つのページは、同じ節を同じ順に並べ、同じことを書く。片方にだけある節や項目を作らない。
- ナビゲーションの右端に、もう一方の言語へのリンク（日本語版では「English」、英語版では「日本語」）を置く。
- 各ページの `head` に、両方の言語の `<link rel="alternate" hreflang="...">` を置く。
- ブラウザの言語による自動の振り分けはしない。
- プレイグラウンドのスクリプト（`main.ts`、`worker.ts`）は 2 つのページで共有する。
  - スクリプトが出す文言（読み込み中の表示、診断、時間の表示など）は、言語ごとの文言の表に置く。
  - どちらの表を使うかは、`document.documentElement.lang` で決める。
- 標語の「組版をソフトウェアに」（縦組み）と、英語の "Typesetting, as software." は、両方のページに置く。

### 色

- 地は白（#ffffff）、文字は黒（#000000）、強調は藍（#1f4e9c）にする。
- 強調の色を使うのは、次のものだけにする。
  - 標語の「ソフトウェア」。
  - 英語の見出しの "as software."。
  - 四つの原則の番号と、「もう必要ありません」の一覧の原則の名前。
  - 原稿の欄の、命令の部分（`[ruby: ...]` の角括弧と命令の名前など）。
  - 拡張の節のプラグインと関数の拡張子（`.wasm`、`.emet`）。
  - 関連プロジェクトの役割の名前（Editor など）。
  - マニュアルの節の表紙の四角の、読み手の印（USER、DEV）。
- 黒の地の上（使い手のマニュアルの表紙の四角、コードの例、仕事の輪の人の段階）では、藍が沈んで読みにくいので、明るい藍（#9fb6e0）を使う。
- プレビューの背景は灰色（#4a4a4a）にし、組んだページを白く見せる。

### 節の構成

[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) の節の構成を、次の順にする。

1. **標語**（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり）。インストールの手順とマニュアル 2 種へのリンクも、ここに置く。
2. **プレイグラウンド**（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) と [tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) のとおり）。
3. **四つの原則**（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) の「考え方」を置きかえる、後述）。
4. **拡張**（新しい節）：プラグインと関数を左右に並べる。狭い画面では縦に並べる。
5. **TeX と InDesign との比較**（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり）。
6. **マニュアル**（新しい節）。
7. **関連プロジェクト**（新しい節）。
8. **インストールとリンク**（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり）。

### 四つの原則の節

[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) の「考え方」の 4 つの点（テキストのフォルダ、同じバイト列、スタイルはデータ、日本語組版）を、使い手のマニュアルの四つの仕組みに沿った節に置きかえる。
日本語組版は、標語の下の要点と比較の表で扱う。スタイルがデータであることは、バージョン管理の原則の中で書く。

- 見出しは「組版を、どうソフトウェアにするか」（英語版は "How Golem makes typesetting software"）とする。
- 導入の 2 段落
  - 今の本の作り方では、原稿、紙面、赤字が三つの写しに分かれ、変更を移すことと確かめることが人の手と目に任されている。
  - ソフトウェアの開発は、それを仕組みで解いてきた。Golem はそのやり方を組版に持ち込み、四つの原則がそれを支える。四つは順につながる。
- 四つの原則を、番号つきで縦に並べる。各原則は、次の 3 つを持つ。
  - 名前と、1 行の要約。
  - どう実現しているかの説明（3 文から 4 文）。
  - 「Tools」：その原則を支えるツールと、その役目を一行で。

  | 原則 | 前提 | ツール |
  | --- | --- | --- |
  | 01 決定性 | なし（土台） | `golem build` |
  | 02 バージョン管理 | 01 | `git`、`golem fmt` |
  | 03 CI | 02 | `golem check`、`golem lint`、`golem preflight`、`golem build --profile prod` |
  | 04 見た目の回帰テスト | 01 と 03 | shem |

- 決定性の Tools には、Golem の CI が x86-64 と aarch64 で出力の一致を確かめていることと、保証が PDF、HTML、テキストで EPUB はまだであることを添える。
- 見た目の回帰テストの Tools には、Golem 自身の見た目の回帰テストが shem を使っていることと、ページの画像を比べる機能は Golem の外にあることを添える。
- 節の終わりに、仕事の輪を 5 つの段階で横に並べる。「原稿を直す（人）」「履歴に残す（01・02）」「組んで検査する（03）」「前の版と比べる（04）」「変わったページを確かめる（人）」。人の段階だけを黒の地にする。その下に、人の手が要るのは二か所だけで、四つのどれが欠けても輪が閉じないことを書く。狭い画面では縦に並べる。
- 節の最後に、「これらは、もう必要ありません」（英語版は "You no longer need to"）の見出しで、四つの原則によって要らなくなる作業を列挙する。各項目には、それを要らなくする原則の番号と名前を添える。項目は、使い手のマニュアルの「はじめに」の冒頭に挙げた問題から取る。打ち消し線では示さない（作業者の指示による）。

  | 要らなくなる作業 | 原則 |
  | --- | --- |
  | Word、InDesign、PDF の写しのあいだで、変更を手で移すこと | 02 バージョン管理 |
  | ファイル名に final と付けて、どれが最新かを区別すること | 02 バージョン管理 |
  | 組版の規則を、担当者の頭の中にだけ置いておくこと | 02 バージョン管理 |
  | フォントを更新して動いた折り返しの、原因を探すこと | 01 決定性 |
  | ライセンスの入った一台が空くのを、皆で待つこと | 03 CI |
  | 初校と再校のゲラを並べて、赤字の反映を一行ずつ目で追うこと | 04 見た目の回帰テスト |
- 書くことは、使い手のマニュアルの「はじめに」と README で確かめられることに限る。

標語の下の説明も、決定性の保証の範囲に合わせて、「同じ入力からは、どのコンピューターでも同じバイト列の PDF が出ます」とする（EPUB を含めない）。

### 拡張の節

- プラグイン
  - プラグインが WebAssembly のファイルであることを書く。また、Golem がファイル、ネットワーク、時計、乱数を渡さないので、プラグインを使っても同じバイト列に組めることを書く。
  - 4 つの種類（コマンド、ブロックコマンド、フィルタ、一覧）を、一行ずつの説明で並べる。
  - 例として、`manifest.toml` の `[plugins.<名前>]` と `golem plugin lock` を示す。例は使い手のマニュアルの第 10 章から取る。
- 関数
  - 関数を Emet で書き、原稿から呼べることを書く。関数が読めるファイルは、マニフェストで許したものだけであることも書く。
  - 例として、`emet-samples` の `fn/numbers.emet` の `yen` と、それを呼ぶ原稿と、その結果を示す。
  - Emet が 1.x のあいだ実験的な機能で、書き方が変わることがあると添える。
- 例のコードは、`wasm.lock` で取り込む Golem と同じタグの記述に合わせる。

### マニュアルの節

- 使い手のマニュアルと開発者のマニュアルを並べ、それぞれに対象の読み手と、主な章を 1 文から 2 文で書く。
- リンク先は、`wasm.lock` で取り込む Golem と同じタグのリリースの PDF とする。HTML の tar.gz へのリンクも添える。
- マニュアルが Golem で組んだものであることを書く。
- 英語版では、マニュアルが日本語で書かれていることを書く。
- 表紙の代わりに、表題を縦に組んだ黒と白の四角を置く。マニュアルの PDF から画像を作って置くことはしない。

### 関連プロジェクトの節

- 3 つのプロジェクトを、役割の名前と 1 文から 2 文の説明で並べる。
  - Aleph（エディタ）：Golem の原稿を書くためのデスクトップアプリ。リンク先は `../aleph/`（[ADR 0002](0002-aleph-page.md)）。
  - shem（ラスタライザ）：Golem の PDF のページを PNG に描く。Golem の見た目の回帰テストと、このページのプレビューに使っている。リンク先は GitHub のリポジトリ。
  - peg-hs（パーサの生成）：Golem の `.gm` のパーサは peg-hs で生成している。リンク先は `../peg-hs/`。
- 影と角丸のカードにはせず、罫線で区切った 3 つの列にする（[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) の見た目の方針）。

### 目次

- 目次のページ（`site/index.html`）に Golem を足す。説明は日本語にする。

## 実装しないこと

- Golem のページのほかの言語。
- ブラウザの言語による自動の振り分けと、選んだ言語を覚えること。
- NablaSKK と peg-hs のページの多言語化。この 2 つは、[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) のとおり 1 つの言語のままにする。
- プラグインと関数をプレイグラウンドで動かすこと（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり、プラグインは外す）。
- マニュアルの中身をページに取り込むこと。

## テスト設計

先に書いて失敗させてから実装する。

- 2 つの言語のページ（Deno のテストで、組み立てた `_site/` の HTML を読む）
  - `golem/index.html` の `lang` が `ja`、`golem/en/index.html` の `lang` が `en` である。
  - 2 つのページの `<section>` の数と、各節の `id` の並びが同じである。
  - どちらのページも、自分ともう一方の言語の `hreflang` の `alternate` を持ち、もう一方の言語へのリンクを持つ。
- スクリプトの文言
  - 日本語と英語の文言の表が、同じキーの集合を持つ。
  - `lang` が `ja` なら日本語の表を、`en` なら英語の表を選ぶ。
- マニュアルのリンク
  - 2 つのページのマニュアルのリンクが、`wasm.lock` の Golem の行と同じタグの `golem-manual-<タグ>.pdf` と `golem-dev-manual-<タグ>.pdf` を指す。
- 関連プロジェクトのリンク
  - `../aleph/` と `../peg-hs/` が、組み立てたサイトの中にある（`check-site.ts` の検査で確かめる）。
- 四つの原則の節
  - 2 つのページの四つの原則の節に、`golem build`、`golem fmt`、`golem check`、`golem lint`、`golem preflight`、`shem` の名前がある。
- 自動で確かめないこと
  - 四つの原則の節の記述：実装するときに、取り込むタグの使い手のマニュアルの「はじめに」と README と照らし合わせ、書いたことがそこで確かめられることをプルリクエストに書く。
  - 拡張の節の関数の例：実装するときに、取り込むタグの Golem で `emet-samples` を組み、例に書いた結果が出ることを確かめ、プルリクエストに書く。
  - 色：強調の藍が白の地で、明るい藍が黒の地で、それぞれ 4.5:1 以上になることを、実装の後に測ってプルリクエストに書く。
  - 見た目：実装の後に Safari と Chrome で 2 つのページを開いて確かめる。

## トレードオフ

- 2 つの言語のページを手で書くので、直すときは 2 つとも直す必要がある。節の `id` の並びをテストでそろえ、片方だけ直すことを防ぐ。テンプレートの仕組みを作るより単純である。
- 日本語版を `golem/` に置くので、英語の利用者は 1 回リンクをたどる。主な使い手に合わせる。
- 藍は、校正の赤字より Golem との結びつきが弱い。代わりに、Adobe を思わせることを避けられる。
- 四つの原則の節は長く、ページの中ほどまでプレイグラウンドの後の説明が続く。主張を言い切るだけでなく、それぞれをどのツールが支えるかまで書かないと、組版をソフトウェアにするという標語が具体的にならないので、長さを取る。
- 見た目の回帰テストの比較そのものは Golem の外のツールで行うので、Golem だけで四つがそろうわけではない。そのことを Tools の欄に書き、Golem が持つのは比べる前提（決定性）と、ページを画像にする道具（shem）であることを示す。
- マニュアルのリンクを `wasm.lock` のタグに合わせるので、Golem の新しいリリースが出ても、`wasm.lock` を上げるまでは古い版のマニュアルを指す。プレイグラウンドで動く Golem と、リンクするマニュアルの版がずれない。

## 参考文献

- [tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md)
- [tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)
- [tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md)
- [tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md)
- Golem. https://github.com/tett23/golem
- Golem の使い手のマニュアルの「はじめに」. https://github.com/tett23/golem/blob/main/manual/preface.gm
- Golem の README. https://github.com/tett23/golem/blob/main/README.md
- Golem v0.1.0-rc3 のリリース. https://github.com/tett23/golem/releases/tag/v0.1.0-rc3
- shem. https://github.com/tett23/shem
- peg-hs. https://github.com/tett23/peg-hs
- Aleph. https://github.com/tett23/aleph
- WHATWG HTML Living Standard, "Link type "alternate"". https://html.spec.whatwg.org/multipage/links.html#rel-alternate
- W3C, Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/
