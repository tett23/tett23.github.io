# ADR 0002: Aleph の紹介ページ

ステータス: 採択（未実装）

## 文脈

[Aleph](https://github.com/tett23/aleph) は、組版システム Golem の原稿を書くためのデスクトップアプリである。
Tauri で作られ、まず Apple Silicon の macOS を対象にしている。
作業者から、Aleph の紹介ページを作るよう指示があった。指示は次のとおり。

- エディタ、300 dpi の PDF のプレビュー、プロットの画面、設定の画面のスクリーンショットを、カルーセルで見せる。
- 機能の一覧を載せる。
- 本や PDF をつくることに特化した環境だと説明する。ただし「統合開発環境」は出版の分野になじまないので、別の語を使う。
- 「無限の可能性。自由に本を作ろう」のようなコピーを付ける。
- ヒーローには、コピーとアイコンを載せる。
- 色はアイコンの色とし、強調にはアプリで使っている黄色を使う。
- いまは日本語を話す人に向けるので、日本語で書く。

モックを作って作業者に見せた。そのモックを元に、この ADR を書く。

調べてわかったことは次のとおり（2026-11-09 の時点）。

- リリース
  - 最新は v1.0.0-rc1（プレリリース）である。
  - 配布物は `Aleph-v1.0.0-rc1-aarch64-macos.zip` と `SHA256SUMS` の 2 つ。zip には Apple Silicon の Mac のための `Aleph.app` が入っている。golem v0.1.0-rc3 と shem v0.1.0-rc4 を同梱している。
  - アプリは ad-hoc の署名で、公証を受けていない。ダウンロードした後に macOS が開くのを拒むので、Applications に移してから `xattr -dr com.apple.quarantine /Applications/Aleph.app` を一度実行する（リリースノートによる）。
- アイコン
  - `public/icon.svg` にある。黒に近い灰色（#2a2a2c から #121214 への縦のグラデーション）の角丸の四角に、生成りの白（#f2efe8）で ℵ を置いたものである。
  - ℵ は、ヒラギノ明朝 ProN W6 の字形をアウトラインにしたものである。
- アプリの色（`app/style.css`）
  - 強調の色は、ライトの外観で #a8873f、ダークの外観で #c9a862 である。
  - 仕様書では、強調の色を「彩度を落とした黄土色」としている。
- 機能（`docs/specifications.md`）
  - 縦書きと横書きの一つのエディタ。
  - golem lsp による診断、補完、ホバー、整形。
  - 本文のプレビュー（golem の HTML の出力）とページのプレビュー（golem の PDF を shem で PNG に描く）。
    - ページのプレビューの解像度は、設定の「ページの解像度」で決められる。空なら、枠の幅と画面の倍率から自動で決める。
  - 改ページの位置の見積もり。
  - 保存と Git（自動保存、1 日 1 回の自動のコミット、Git のパネル）。
  - プロットの表とガントチャート。
  - シートの目標の字数、原稿用紙の換算、書くことのチェック、ノート。
  - ウィキリンク、キーワード、埋め込み。
  - ワークスペースの検索と置換。
  - 共有ライブラリ（フォント、Golem のプラグイン、関数を、プロジェクトをまたいで使う）。
  - Markdown から `.gm` への変換。
  - Aleph のプラグイン。
  - Markdown、CSV、TSV、TOML、JSON の仲間、SVG、Mermaid、PDF、画像を開ける。
- Aleph のライセンスは MIT で、作者はこのリポジトリと同じである。

## 実装すること

### URL と言語

- `https://tett23.github.io/aleph/` に置く。ソースは `site/aleph/`。
- 日本語だけで書く（`lang="ja"`）。
- 目次のページ（`site/index.html`）に Aleph を足す。説明は日本語にする。

### 言葉

- 「統合開発環境」の代わりに、「本と PDF をつくることに特化した執筆・組版環境」と書く。出版の分野で通じる「執筆」と「組版」を使う。
- ヒーローのコピーは「無限の可能性。自由に、本をつくろう。」とする（作業者の指示による）。
- そのほかの文は、[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) の見た目の方針に従い、Aleph の仕様書で確かめられることだけを書く。

### 色と書体

- 地はアイコンの黒（#141416）、文字はアイコンの ℵ の白（#f2efe8）、強調はアプリのダークの外観の黄色（#c9a862）にする。
- 補助の文字は灰色（#9b988f）にし、罫線は #2c2c30 にする。
- 強調の色を使うのは、次のものだけにする。
  - コピーの「自由に」。
  - ダウンロードのボタンの地。
  - 節の英語の小見出し（SCREENS など）。
  - 機能の一覧の項目の印。
  - カルーセルの番号と、選んでいるサムネイルの枠。
- ヒーローのコピーと締めの見出しは、アイコンの ℵ と同じヒラギノ明朝で組む（OS の書体なので読み込まない）。ほかは OS のゴシック体で組む。
- 背景にグラデーションを使わない。

### 節の構成

1. **ナビゲーション**：アイコンと名前、各節へのリンク、Golem のページへのリンク、GitHub。
2. **ヒーロー**
   - 左にアイコン、右にコピーを置く。
   - コピーの下に、執筆・組版環境であることと、エディタ、300 dpi のページ、プロットと進み具合を一つの画面で扱えることを、2 文ほどで書く。
   - ダウンロードのボタン（リリースのページへ）、GitHub へのリンク、「macOS（Apple Silicon）・プレリリース」を置く。
3. **画面**（カルーセル、後述）。
4. **機能の一覧**
   - 上の「調べてわかったこと」の機能から、12 項目を 3 列に並べる。
   - 各項目は、見出しと 1 文から 2 文の説明とする。
   - 罫線で区切り、影と角丸のカードにしない。
5. **Golem との関係**
   - Aleph のページのプレビューは Golem が組んだ PDF そのものであることを書く。
   - Golem と shem を同梱していることを書く。
   - 「原稿 → Golem → shem」の流れを、罫線の枠と矢印で示す。
   - Golem のページ（`../golem/`）にリンクする。
6. **インストール**
   - zip と `SHA256SUMS` をダウンロードして照合する手順を書く。
   - 公証を受けていないので、`xattr -dr com.apple.quarantine /Applications/Aleph.app` を一度実行する必要があることを書く。
7. **締め**：アイコン、短い見出し、ダウンロードのボタン。
8. **フッター**：ライセンス（MIT）と作者。

### 画面のカルーセル

- 4 枚のスクリーンショットを、次の順に並べる。

  | ファイル | 画面 | 説明に書くこと |
  | --- | --- | --- |
  | `editor.png` | エディタ | 縦書きと横書きの一つのエディタ。右のパネルに目標、キーワード、書くこと、ノート |
  | `preview.png` | ページのプレビュー | 横書きのエディタの右に、300 dpi で描いたページ |
  | `plot.png` | プロット | シーンの表とサブプロットごとのガントチャート |
  | `settings.png` | 設定 | 外観、プレビューの解像度、保存と Git、原稿用紙の換算、Golem と shem |

- 大きな 1 枚の下に、番号（「01 / 04」）、画面の名前、1 文の説明、4 枚のサムネイルを置く。
- 振る舞いは、NablaSKK のページの設定アプリのカルーセルと同じにする。
  - サムネイルのタブ、前後のボタン、左右の矢印キーで切りかえる。
  - 自動では送らない。
  - スクリプトがなければ、4 枚を横にスクロールして見られる。
- そのため、`site/nablaskk/carousel.ts` とそのテストを `site/lib/carousel.ts` に移し、NablaSKK と Aleph の両方から使う。移すときに振る舞いは変えない。
- 画像の `alt` には、画面の名前と、映っているものを書く。

### スクリーンショットの撮り方

撮り方は `site/aleph/screenshots/README.md` に書く。NablaSKK のスクリーンショットの README と同じ形にする。

- 版は、ページからリンクする Aleph のリリース（今は v1.0.0-rc1）にする。リリースの zip の `Aleph.app` で撮る。
- macOS をダークモードにし、Aleph の外観を「OS に合わせる」にする。
- ウィンドウの大きさは 1280 × 800 ポイントにし、Retina の画面で撮る（2560 × 1600 画素）。
- `screencapture -x -o -l <ウィンドウ ID>` で、ウィンドウだけを影なしで撮る。
- 見本のプロジェクト
  - 小林多喜二『蟹工船』（青空文庫）の冒頭を章に分けたものにする。Golem のテストのフィクスチャーにある `.gm` を使う。
  - `plot.csv` とノートは、撮るために作った見本である。そのことを README に書く。
  - 底本と青空文庫の入力者、校正者を、README に書く。
- 設定の画面では、「ページの解像度」を 300 dpi にする。ページのプレビューは、その設定で描いたものを撮る。
- 版を上げて見た目が変わったら、同じ手順で撮り直す。

### アイコン

- Aleph の v1.0.0-rc1 のタグの `public/icon.svg` を、`site/aleph/icon.svg` にコピーする。どこからコピーしたかを、`site/aleph/screenshots/README.md` に書く。
- ヒーロー、ナビゲーション、締めに使い、ページのファビコンにも使う。

### リリースへのリンク

- ダウンロードのボタンは、リリースの zip を直接指さず、リリースのページ（`https://github.com/tett23/aleph/releases/tag/<タグ>`）を指す。インストールの節には、zip と `SHA256SUMS` の URL を書く。
- ページの中で Aleph の版を書く場所（リンク、インストールの手順、スクリーンショットの README）は、同じタグにそろえる。

## 実装しないこと

- 英語版。
- Aleph をブラウザで動かす試用。
- 動画とアニメーション。
- Windows と Linux、Intel の Mac のための案内（配布物がない）。
- Aleph の公証や署名についての変更（Aleph のリポジトリの仕事である）。

## テスト設計

先に書いて失敗させてから実装する。

- カルーセル（`site/lib/carousel.ts`）
  - NablaSKK のカルーセルの既存のテストを `site/lib/` に移し、移した後もすべて通る。
  - Aleph のページの 4 枚で、タブ、前後のボタン、左右の矢印キーで切りかわり、選んでいるタブに `aria-selected="true"` が付く。
- ページ（Deno のテストで、組み立てた `_site/` の HTML を読む）
  - `aleph/index.html` の `lang` が `ja` である。
  - カルーセルの 4 枚の画像があり、どれも空でない `alt` を持つ。
  - ページの中の Aleph のリリースへのリンクが、すべて同じタグを指す。そのタグは、`site/aleph/screenshots/README.md` に書いた版と同じである。
  - インストールの節に `xattr -dr com.apple.quarantine /Applications/Aleph.app` がある。
- `check-site.ts`
  - `../golem/` と `icon.svg` と 4 枚のスクリーンショットが、組み立てたサイトの中にある。
- 自動で確かめないこと
  - コントラスト：文字、補助の文字、強調の色が、地の #141416 に対して 4.5:1 以上あること、ボタンの文字（#141416）が黄色の地に対して 4.5:1 以上あることを、実装の後に測ってプルリクエストに書く。
  - 見た目とキーボード操作：実装の後に Safari と Chrome でページを開いて確かめる。

## トレードオフ

- スクリーンショットはリリースのアプリで撮るので、アプリの見た目が変わるたびに撮り直す必要がある。HTML で画面を再現すれば撮り直しは要らないが、実物と違う画面を見せることになる。
- 地を黒にするので、ほかのページ（白の地）と並べると、このページだけ暗い。色をアイコンから取るという [tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) の方針と、作業者の指示に従う。
- ヒーローのコピーは、[tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md) が避けるとした、誰にでも当てはまる宣伝文句に近い。作業者の指示によるので、ほかの文で Aleph の事実を具体的に書いて補う。
- カルーセルを `site/lib/` に移すので、NablaSKK のページの変更が増える。同じものを 2 つ持つより単純である。
- 公証を受けていないアプリを案内するので、`xattr` の手順をページに書く。手順を書かなければ、ダウンロードした人はアプリを開けない。

## 参考文献

- [tett23/tett23 の ADR 0002](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0002-product-pages-on-github-pages.md)
- [tett23/tett23 の ADR 0003](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0003-nablaskk-page.md)
- [ADR 0001](0001-golem-page-in-japanese-and-english.md)
- Aleph. https://github.com/tett23/aleph
- Aleph v1.0.0-rc1 のリリース. https://github.com/tett23/aleph/releases/tag/v1.0.0-rc1
- Aleph の仕様書. https://github.com/tett23/aleph/blob/main/docs/specifications.md
- 小林多喜二「蟹工船」, 青空文庫. https://www.aozora.gr.jp/cards/000156/card1465.html
- W3C, Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices Guide, "Carousel (Slide Show or Image Rotator) Pattern". https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
