# ADR 0003: Golem v0.1.0-rc4 の golem.wasm と shem v0.1.0-rc7 の shem.wasm で Golem のページを作る

ステータス: 採択

## 文脈

Golem のページは、[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)、[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md)、[ADR 0001](0001-golem-page-in-japanese-and-english.md) で中身を決めてあり、Golem の wasm のリリースを待っていた。
2026-11-08 に、Golem v0.1.0-rc4、shem v0.1.0-rc7、Aleph v1.0.0-rc2 が出た（どれもプレリリース）。
作業者から、出た版に合わせてページを実装するよう指示があった。

これらの ADR は、wasm の受け渡しの形をリリースの前に見込みで書いている。
出た wasm を読み、動かしてみると、見込みと違う点と、ADR が決めていない点があった。
この ADR は、それらを決める。

調べてわかったことは次のとおり（2026-11-09 の時点）。

### Golem v0.1.0-rc4 の golem.wasm

- `golem.wasm` は、リリースの `golem-v0.1.0-rc4-wasm32-wasi.tar.gz`（7,660,043 バイト）の中の `golem-v0.1.0-rc4-wasm32-wasi/golem.wasm` にある。単独のファイルとしては添付されていない。大きさは 47,335,493 バイトで、SHA-256 は `21410d6636997eeefd1d828966080af8e2aa54b16b455058e0065051e3bed8f8` である。アーカイブの SHA-256 は、リリースの `SHA256SUMS` と一致した。
- WASI preview1 の reactor モジュールである。ホストは `_initialize` を一度、`hs_init(0, 0)` を一度呼んでから、`golem_alloc`、`golem_build_pdf`、`golem_result_len`、`golem_free`、`golem_version` を使う（同梱の `README`）。
- 入力は、ファイルの並びの枠（パスの長さ、パス、中身の長さ、中身。長さは `uint32` のリトルエンディアン）である。ファイルはプロジェクトのフォルダーのもので、`manifest.toml` を含む。[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) が見込んだ「原稿、`style.toml`、フォント」だけでは組めない。`manifest.toml` が PDF のバイト列を決める入力の一つだからである（Golem の docs/adr/0199）。
- 結果の枠は、状態の 1 バイト、PDF の長さと PDF、diagnostics の JSON の長さと JSON である。JSON は `golem build --target pdf --format json` が標準エラーに書くものと同じで、`span` の `line` と `column` は 1 から数えるコードポイントの数である（Golem の仕様書）。
- 標準化された例外処理（`try_table`、`throw_ref`）を使うので、Chrome 137、Firefox 131、Safari 18.4 以降でしか読み込めない（同梱の `README`）。
- import は `wasi_snapshot_preview1` の 22 の関数で、`fd_read`、`path_open`、`fd_readdir`、`poll_oneoff` など、このサイトの `site/lib/wasi.ts` が実装していない関数を含む。そのため、「`wasm.lock` の wasm の import がこの範囲に収まる」という今のテストに通らない。
- 手元で、`site/lib/wasi.ts`（実装していない関数は `ENOSYS` を返す）と Deno 2.9.7 で `golem.wasm` を動かした。Golem のテストのフィクスチャーの『蟹工船』は、診断が notice だけで、1,670,364 バイト、129 ページの PDF に組めた。2 回組むと、同じ大きさの PDF になった。1 回の組版に 12 秒から 14 秒かかった。このあいだに呼ばれた WASI の関数は、`clock_time_get` と `environ_sizes_get` だけだった。
- GitHub Pages は `.wasm` を gzip で送る（2026-11-09 に `https://tett23.github.io/assets/peg-hs.wasm` の応答で `content-encoding: gzip` を確かめた）。`golem.wasm` を gzip -9 で縮めると 7,443,149 バイトになる。

### shem v0.1.0-rc7 の shem.wasm

- リリースに単独のファイル `shem.wasm` として添付されている。import はない。
- エクスポートは `shem_alloc`、`shem_free`、`shem_open(ptr, len, dpi)`、`shem_page_count(doc)`、`shem_render(doc, page)`、`shem_image_ptr`、`shem_image_width`、`shem_image_height`、`shem_close`、`shem_error_ptr`、`shem_error_len` である（shem の仕様書）。[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) が頼んだ、ページの数を返す関数と、指定したページだけを描く関数がある。
- 上の『蟹工船』の PDF を 300 DPI で開き、1 ページめを描くと、1512 × 2150 画素で、38 ミリ秒だった。
- `site/wasm.lock` には、shem v0.1.0-rc6 の `shem.wasm` の行がすでにあるが、どのページも使っていない。

### サンプル

- 「蜘蛛の糸」（青空文庫、図書カード No.92）のルビつきのテキストは `92_ruby_164.zip` で、SHA-256 は `3b9990dc830f79346242db7f37969a1c2c7dbb7fb9abe9915e8c89c83f8628c9` だった。
- Golem v0.1.0-rc4 のタグの `golem-fixtures aozora`（`convertAozora`）で `.gm` に変えると、外字の注記「※［＃「特のへん＋廴＋聿」、第3水準1-87-71］」（犍、U+728D）が 18 か所すべて「〓」になった。`aozora-prose` でも同じだった。ルビは「〓[ruby: 陀多|かんだた]」のように、外字を除いた「陀多」に付いた。
- 「〓」を「犍」に置きかえ、ルビを「[ruby: 犍陀多|かんだた]」にし、v0.1.0-rc4 の `golem fmt` で整えたものを、『蟹工船』と同じ `style.toml`（B6 の縦組み、42 字 16 行）と Noto Serif JP のサブセットの OTF で組むと、診断なしで 8 ページになった。`golem lint` の指摘もなかった。犍の字形はフォントにある（字形がなければ出る診断が出ない）。
- フォントは、Golem のリポジトリの v0.1.0-rc4 のタグの `modules/golem-driver/test/fixtures/kanikosen/fonts/NotoSerifJP-Regular.otf`（6,210,492 バイト）で、同じフォルダーに `LICENSE-NotoSerifJP.txt`（SIL Open Font License 1.1）がある。

### ページの記述

v0.1.0-rc4 のタグで、[ADR 0001](0001-golem-page-in-japanese-and-english.md) がページに書くとした事実を確かめた。

- 使い手のマニュアルの「はじめに」は、`determinism` のジョブが x86-64 と aarch64 で出力の一致を確かめていること、決定性の保証が PDF、HTML、プレーンテキストで EPUB はまだであること、ページの画像を比べる機能が Golem に入っていないことを書いている。
- 第 10 章は、プラグインの種類をコマンド、ブロックコマンド、フィルタ、一覧の 4 つとし、`[plugins.furigana]` の `url` と `golem plugin lock` の例を挙げ、プラグインにファイル、ネットワーク、時計、乱数を渡さないと書いている。
- Emet が 1.x のあいだ実験的な機能であることは、第 8 章と付録 J にある。
- `emet-samples` を v0.1.0-rc4 の `golem build --target text` で組むと、`総額は[n.yen 1234567]です。` が「総額は1,234,567円です。」になった。
- README の「Usage」に、`golem build`（`--profile prod`）、`golem check`、`golem preflight`、`golem lint`、`golem fmt` がある。Linux の配布物は musl で完全に静的にリンクしている。
- マニュアルは `golem-manual-v0.1.0-rc4.pdf`、`golem-manual-v0.1.0-rc4-html.tar.gz`、`golem-dev-manual-v0.1.0-rc4.pdf`、`golem-dev-manual-v0.1.0-rc4-html.tar.gz` として添付されている。

### Aleph

- Aleph v1.0.0-rc2 の配布物は `Aleph-v1.0.0-rc2-aarch64-macos.zip` と `SHA256SUMS` で、golem v0.1.0-rc4 と shem v0.1.0-rc7 を同梱している。公証を受けていないこと、`xattr -dr com.apple.quarantine /Applications/Aleph.app` の手順は v1.0.0-rc1 と同じである（リリースノート）。
- [ADR 0002](0002-aleph-page.md) は、ページからリンクする版を「今は v1.0.0-rc1」としており、版を一つにそろえることだけを決めている。

## 実装すること

[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)、[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md)、[ADR 0001](0001-golem-page-in-japanese-and-english.md)、[ADR 0002](0002-aleph-page.md) のうち、次の点を決める。ほかの点はそれらの ADR のとおりにする。

### 取り込む版

- Golem は v0.1.0-rc4 にする。`golem.wasm`、フォント、フォントのライセンスを、このタグから取り込む。マニュアルのリンクも、このタグにする（[ADR 0001](0001-golem-page-in-japanese-and-english.md) のとおり、`wasm.lock` と同じタグ）。
- shem は v0.1.0-rc7 にする。`wasm.lock` の `shem.wasm` の行を v0.1.0-rc6 から置きかえる。
- Aleph のページからリンクする版は v1.0.0-rc2 にする（[ADR 0002](0002-aleph-page.md) の「今は」の版）。スクリーンショットも v1.0.0-rc2 の `Aleph.app` で撮る。

### `wasm.lock` の 4 つめの欄

- `wasm.lock` の行に、省略できる 4 つめの欄「アーカイブの中のパス」を足す。形は `名前 URL SHA-256 アーカイブの中のパス` である。
- 4 つめの欄がある行では、URL は gzip で圧縮した tar のアーカイブを指す。`scripts/fetch-assets.sh` は、アーカイブを一時的な場所に取ってきて、そのパスのファイルだけを取り出し、`名前` で置く。
- SHA-256 は、取り出したファイルのものとする。アーカイブのものにはしない。置いたファイルの SHA-256 で取りなおすかを決める、今の仕組みをそのまま使えるからである。アーカイブの中身が一バイトでも違えば、取り出したファイルの SHA-256 も違う。
- 取り出したファイルの SHA-256 が合わないとき、アーカイブにそのパスがないとき、アーカイブが読めないときは、失敗してファイルを残さない。一時的な場所のアーカイブは、成否によらず消す。
- `golem.wasm` の行は次のとおりにする。

  ```
  golem.wasm https://github.com/tett23/golem/releases/download/v0.1.0-rc4/golem-v0.1.0-rc4-wasm32-wasi.tar.gz 21410d6636997eeefd1d828966080af8e2aa54b16b455058e0065051e3bed8f8 golem-v0.1.0-rc4-wasm32-wasi/golem.wasm
  ```

- `golem.wasm` が同梱の `LICENSE` と `THIRD_PARTY_LICENSES/` は、サイトに置かない。ページのプレイグラウンドの下から、リリースのページと、GNU MP のソースが添付されていることにリンクする。
- フォント（`NotoSerifJP-Regular.otf`）と、そのライセンス（`LICENSE-NotoSerifJP.txt`）は、Golem のリポジトリの v0.1.0-rc4 のタグの raw の URL から、今の 3 つの欄の行で取り込む。ライセンスはサイトの `assets/` に置き、プレイグラウンドの下からリンクする。

### WASI の範囲

- `site/lib/wasi.ts` の実装する関数は変えない。実装していない関数が `ENOSYS` を返すことも変えない。
- 「`wasm.lock` の wasm の import が実装する関数の範囲に収まる」というテストを、次のように変える。
  - `golem.wasm` のほかの wasm は、今のとおり、import が実装する関数の範囲に収まることを確かめる。
  - `golem.wasm` は、import が `wasi_snapshot_preview1` だけであることを確かめる。そのうえで、サンプルを組んだときに、実装していない関数が一度も呼ばれないことを確かめる。呼ばれたら、テストは関数の名前を出して失敗する。
- `golem.wasm` はディレクトリを開かない（preopen を渡さない）ので、ファイルの関数は呼ばれないと見込む。上のテストは、その見込みを版を上げるたびに確かめる。

### 入力のファイル

プレイグラウンドは、`golem_build_pdf` に次の 4 つのファイルを渡す。

| 入力の枠のパス | 中身 | 書きかえ |
| --- | --- | --- |
| `manifest.toml` | `site/golem/sample/manifest.toml` | できない |
| `style.toml` | 原稿の欄の `style.toml` のタブ | できる |
| `kumo-no-ito.gm` | 原稿の欄の `kumo-no-ito.gm` のタブ | できる |
| `fonts/NotoSerifJP-Regular.otf` | `assets/NotoSerifJP-Regular.otf` | できない |

- `manifest.toml` は、章を `kumo-no-ito.gm` の 1 つにし、`[metadata]` に題、著者、言語、`id`、日付を書き、`[source]` の `paragraph-separator` を `"line"` にし、`[targets.pdf]` だけを置く。
- 原稿の欄のタブは、[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり 2 つにする。`manifest.toml` はタブにせず、原稿の欄の下に「`manifest.toml` は固定です」とリンクつきで示す。
- 診断の位置が `kumo-no-ito.gm` か `style.toml` なら、押すとそのタブに切りかえて位置に移る。ほかのファイル（`manifest.toml` など）の診断は、押せない行として表示する。
- 結果の状態が 1（入力の枠を読めない）のときは、ページの誤りとして、診断の欄に一行で出す。

### サンプル

- `site/golem/sample/kumo-no-ito.gm` は、上の「調べてわかったこと」の手順で作る。すなわち、`92_ruby_164.zip` のテキストを Shift_JIS から UTF-8 にし、Golem v0.1.0-rc4 の `golem-fixtures aozora` で変え、「〓[ruby: 陀多|」を「[ruby: 犍陀多|」に、残りの「〓」を「犍」に置きかえ、v0.1.0-rc4 の `golem fmt` で整える。
- 手順、zip の SHA-256、外字を置きかえたこと、底本と入力者と校正者を、`site/golem/sample/README.md` に書く。末尾の底本と作成者の節は、`convertAozora` が残したものをそのまま使う。
- `style.toml` は、Golem v0.1.0-rc4 のタグの『蟹工船』のフィクスチャーの `style.toml` を写す。

### 対応しないブラウザ

- `golem.wasm` をコンパイルできないときは、プレビューの代わりに、対応するブラウザの版（Chrome 137、Firefox 131、Safari 18.4 以降）を書いた一文を出す。原稿の欄は書きかえられるままにする。

### 読み込みの量

- 初めて開いたときに読み込むのは、`golem.wasm`（gzip で約 7.4 MB）、フォント（約 6.2 MB）、`shem.wasm` である。読み込み中の表示には「約 14 MB」と書く。
- 読み込みは、プレイグラウンドの節が画面に入ってからではなく、ページを開いたときに始める。プレイグラウンドは標語のすぐ下にあり、開いてすぐ組版の結果を見せる（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)）からである。

### 見開きの組み方

- [tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) は「右綴じの見開き」で表示するとし、[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) はラスタライズするのを「表示している見開きの 2 ページ」としている。どのページを組にするかは決めていない。
- 右綴じの本では、奇数のページが左に、偶数のページが右に来る。1 ページめは、最初の見開きの左に一人で置かれる。Golem もこの規則でノンブルの位置（`bottom-outside`）を決める。
- そこで、見開きを次のように組む。最初の見開きは 1 ページめだけ（左）、その次からは、右に偶数のページ、左にその次の奇数のページを置く（2 と 3、4 と 5、…）。ページの数が偶数なら、最後の見開きは右のページだけになる。
- ラスタライズするのは、表示している見開きのページ（1 ページか 2 ページ）だけにする。[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md) のテストの「最初の見開きの 2 ページだけ」は、「最初の見開きの 1 ページめだけ」と読みかえる。

### 時間の表示

- プレビューの下に、組版の時間と、表示している見開きのラスタライズの時間を、ミリ秒で出す。ラスタライズの時間は、そのとき描いたページだけの合計で、残しておいたページを使ったときは 0 になる。

## 実装しないこと

- `golem.wasm` の `LICENSE` と `THIRD_PARTY_LICENSES/` をサイトに置くこと（リリースのページにリンクする）。
- `manifest.toml` の書きかえ。
- `site/lib/wasi.ts` のファイルの関数の実装。
- 組んでいる途中の組版を止めること。`golem_build_pdf` は同期で動くので、Worker の中で止められない。[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり、途中の書きかえの結果は捨てる。
- 対応しないブラウザのための別の wasm。

## テスト設計

先に書いて失敗させてから実装する。[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)、[tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md)、[ADR 0001](0001-golem-page-in-japanese-and-english.md)、[ADR 0002](0002-aleph-page.md) のテストに、次を足す。

- `scripts/fetch-assets.sh`（Deno のテストで、テストの中で作った tar.gz を `file://` の URL で渡す）
  - 4 つめの欄のある行では、アーカイブのそのパスのファイルが `名前` で置かれ、アーカイブのほかのファイルは置かれない。
  - 取り出したファイルの SHA-256 が合わなければ、失敗してファイルを残さない。
  - アーカイブにそのパスがなければ、失敗してファイルを残さない。
  - 置いてあるファイルの SHA-256 が合えば、アーカイブを取りなおさない。
  - 3 つの欄の行は、今のとおりに動く（今のテストがすべて通る）。
- WASI
  - `golem.wasm` のほかの wasm の import が、実装する関数の範囲に収まる。
  - `golem.wasm` の import が `wasi_snapshot_preview1` だけである。
  - `golem.wasm` でサンプルを組むあいだ、実装していない関数が呼ばれない。
- 入力の枠と結果の枠（純粋な関数のテスト）
  - 入力の枠が、ファイルごとにパスの長さ、パス、中身の長さ、中身の順で、長さがリトルエンディアンになる。
  - 結果の枠の状態、PDF、JSON を読める。長さが足りない結果の枠は、誤りとして返す。
- 見開き
  - 8 ページの見開きは、[1]、[2, 3]、[4, 5]、[6, 7]、[8] である。7 ページなら最後が [6, 7] になる。
  - 各見開きで、偶数のページが右、奇数のページが左に置かれる。
- サンプル
  - `kumo-no-ito.gm` に「〓」がない。
  - `site/golem/sample/README.md` に、zip の SHA-256 と、外字を置きかえたことが書かれている。
- 版
  - `wasm.lock` の `golem.wasm` の URL のタグと、フォントとフォントのライセンスの URL のタグと、2 つのページのマニュアルのリンクのタグが、すべて同じである。
- 自動で確かめないこと
  - 対応しないブラウザの表示：実装の後に、`WebAssembly.compile` が失敗したときの表示を、ブラウザの開発者ツールで `WebAssembly.compile` を失敗させて確かめる。

## トレードオフ

- `wasm.lock` の欄を足すので、取り込みの仕組みが少し複雑になる。代わりに、Golem のリリースのアーカイブをそのまま使える。Golem 側に `golem.wasm` を単独で添付するよう頼む案もあるが、リリースを待つことになる。アーカイブを展開して取り出すのは `tar` だけでできる。
- SHA-256 を取り出したファイルのものにするので、リリースの `SHA256SUMS` の値とは比べられない。比べたいときは、アーカイブを取ってきて `SHA256SUMS` で確かめ、取り出したファイルの SHA-256 を計算して `wasm.lock` に書く。この手順を仕様書に書く。
- `golem.wasm` だけ WASI の検査の仕方が違う。import の一覧だけで確かめるには、ファイルの関数を実装するか、検査を外すしかない。実装すれば、使わない機能が増える。呼ばれないことを動かして確かめるほうが、確かめたいこと（ページの WASI で動くこと）に近い。
- 初めて開いたときに約 14 MB を読み込む。サンプルの文字だけのフォントのサブセットにすれば小さくなるが、書きかえた文字が出なくなる（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md) のとおり、しない）。
- サンプルに手で外字を入れるので、`convertAozora` の出力そのままではない。「〓」のままでは、Golem が日本語の組版で見せたい本文が崩れる。置きかえは README に書き、テストで「〓」がないことを確かめる。

## 参考文献

- [tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)
- [tett23/tett23 の ADR 0006](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0006-golem-preview-at-300-dpi.md)
- [ADR 0001](0001-golem-page-in-japanese-and-english.md)
- [ADR 0002](0002-aleph-page.md)
- Golem v0.1.0-rc4 のリリース. https://github.com/tett23/golem/releases/tag/v0.1.0-rc4
- Golem の docs/adr/0199（PDF の組版を wasm の reactor モジュールにする）. https://github.com/tett23/golem/blob/v0.1.0-rc4/docs/adr/0199-pdf-typesetting-as-wasm-reactor.md
- Golem の仕様書（v0.1.0-rc4）. https://github.com/tett23/golem/blob/v0.1.0-rc4/docs/specifications.md
- shem v0.1.0-rc7 のリリース. https://github.com/tett23/shem/releases/tag/v0.1.0-rc7
- shem の仕様書（v0.1.0-rc7）. https://github.com/tett23/shem/blob/v0.1.0-rc7/docs/specifications.md
- Aleph v1.0.0-rc2 のリリース. https://github.com/tett23/aleph/releases/tag/v1.0.0-rc2
- 芥川龍之介「蜘蛛の糸」, 青空文庫, 図書カード No.92. https://www.aozora.gr.jp/cards/000879/card92.html
- 青空文庫「青空文庫収録ファイルの取り扱い規準」. https://www.aozora.gr.jp/guide/kijyunn.html
- SIL Open Font License 1.1. https://openfontlicense.org/
