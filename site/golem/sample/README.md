# Golem のプレイグラウンドのサンプル

プレイグラウンドで組むサンプルの出どころと、作り方を書く（[tett23/tett23 の ADR 0005](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0005-golem-page.md)、[ADR 0003](../../../docs/adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)）。

## kumo-no-ito.gm

芥川龍之介「蜘蛛の糸」。青空文庫の図書カード No.92（https://www.aozora.gr.jp/cards/000879/card92.html）のルビつきのテキストから作った。

- 底本：「芥川龍之介全集2」ちくま文庫、筑摩書房、1986（昭和61）年10月28日第1刷発行、1996（平成8）年7月15日第11刷発行
- 底本の親本：筑摩全集類聚版芥川龍之介全集、1971（昭和46）年3月〜11月
- 入力：平山誠、野口英司
- 校正：もりみつじゅんじ
- 1997年11月10日公開、2011年1月28日修正

作り方は次のとおり（2026-11-09）。

1. `https://www.aozora.gr.jp/cards/000879/files/92_ruby_164.zip` を取ってくる。SHA-256 は `3b9990dc830f79346242db7f37969a1c2c7dbb7fb9abe9915e8c89c83f8628c9` だった。
2. zip の中の `kumono_ito.txt` を、`iconv -f SHIFT_JIS -t UTF-8` で UTF-8 にする。
3. Golem の v0.1.0-rc4 のタグのソースで、`cabal run golem-fixtures -- aozora kumo.txt kumo-no-ito.gm` を実行する。
4. 外字を置きかえる。`convertAozora` は、外字の注記「※［＃「特のへん＋廴＋聿」、第3水準1-87-71］」（犍、U+728D）を知らないので、18 か所すべてを「〓」にし、ルビを「〓[ruby: 陀多|かんだた]」のように外字の後ろの「陀多」に付ける。そこで、「〓[ruby: 陀多|」を「[ruby: 犍陀多|」に、残りの「〓」を「犍」に置きかえる。
5. Golem v0.1.0-rc4 の `golem fmt` で整える。

末尾の「底本と作成者」の節は、`convertAozora` が青空文庫の規準のとおりに残したものである。

## style.toml

Golem の v0.1.0-rc4 のタグの `modules/golem-driver/test/fixtures/kanikosen/style.toml`（『蟹工船』のフィクスチャー）を写したもの。B6 の縦組み、42 字 16 行で、本文のフォントは `fonts/NotoSerifJP-Regular.otf` である。

## manifest.toml

このページのために書いたもの。プレイグラウンドでは書きかえられない。

## フォント

`fonts/NotoSerifJP-Regular.otf` は、`site/wasm.lock` で、Golem の v0.1.0-rc4 のタグの `modules/golem-driver/test/fixtures/kanikosen/fonts/NotoSerifJP-Regular.otf`（Noto Serif CJK JP 2.003 のサブセットの OTF、SIL Open Font License 1.1）を取り込む。ライセンスは同じフォルダーの `LICENSE-NotoSerifJP.txt` で、サイトの `assets/` に置く。
