# ADR 0006: Aleph のページを v1.0.0-rc4 に合わせる

ステータス: 採択

## 文脈

[ADR 0004](0004-aleph-page-for-v1-0-0-rc3.md) で、Aleph のページからリンクする版を v1.0.0-rc3 にし、スクリーンショットも v1.0.0-rc3 の `Aleph.app` で撮った。
2026-11-09 に Aleph v1.0.0-rc4（プレリリース）が出て、作業者からページを最新にするよう指示があった。

v1.0.0-rc4 のリリースノートと、v1.0.0-rc3 とのタグの差分を読んでわかったことは次のとおり。

- 配布物は `Aleph-v1.0.0-rc4-aarch64-macos.zip` と `SHA256SUMS` の 2 つで、形は v1.0.0-rc3 と同じである。
- 同梱する golem と shem は v0.1.0-rc4 と v0.1.0-rc7 のままである。
- 公証を受けていないこと、`xattr -dr com.apple.quarantine /Applications/Aleph.app` の手順は v1.0.0-rc3 と同じである。
- `public/icon.svg` は v1.0.0-rc3 から変わっていない。
- 直した点は、golem、shem、git をメインスレッドの外で走らせ、長い原稿を組むあいだもウィンドウが固まらないようにしたことである（Aleph の ADR 0062）。
- 変わった点は、git を使えない Mac で、起動時に一度だけ確かめて git を走らせず、Git のパネルに理由と入れ方を出すようにしたことである。設定の画面に、使っている git とその版が出る（Aleph の ADR 0060）。
- 足された機能はない。
- 設定の画面のアプリの版の表示が「1.0.0-rc4」になる。

## 実装すること

[ADR 0004](0004-aleph-page-for-v1-0-0-rc3.md) のうち、次の点を変える。ほかの点は [ADR 0002](0002-aleph-page.md)、[ADR 0003](0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)、[ADR 0004](0004-aleph-page-for-v1-0-0-rc3.md) のとおりにする。

### リンクする版

- Aleph のページからリンクする版を v1.0.0-rc4 にする。ダウンロードのボタン、インストールの節の zip と `SHA256SUMS`、リリースノートへのリンクを、すべて v1.0.0-rc4 のタグにする。
- 画面の節と、Golem との関係の節の版を v1.0.0-rc4 にする。同梱する版はそのままにする。

### スクリーンショット

- 4 枚とも、v1.0.0-rc4 のリリースの zip の `Aleph.app` で、`site/aleph/screenshots/README.md` の手順のとおりに撮り直す。設定の画面に版が映るので、版と画像をそろえるためである。
- `site/aleph/screenshots/README.md` の版を v1.0.0-rc4 にし、撮った日と、撮ったディスプレイを書きなおす。

### テスト

- [ADR 0004](0004-aleph-page-for-v1-0-0-rc3.md) のテスト「リリースへのリンクのタグが v1.0.0-rc3 で、v1.0.0-rc2 が残っていない」を、「リリースへのリンクのタグが v1.0.0-rc4 で、それより前の版が残っていない」にする。

## 実装しないこと

- 機能の一覧を変えること。v1.0.0-rc4 で足された機能はなく、直した点と変わった点は機能の一覧の粒度に合わない。
- Retina の画面で撮ること。手元に Retina の画面がなければ、これまでと同じく等倍で撮り、そのことを README に書く。

## テスト設計

先に書いて失敗させてから実装する。

- `site/aleph/page_test.ts`
  - ページのリリースへのリンクのタグが v1.0.0-rc4 である。
  - ページの本文に、`v1.0.0-rc1` から `v1.0.0-rc3` が残っていない。
  - 今のテスト「すべてのリリースへのリンクが一つのタグで、スクリーンショットの README の版と同じ」と、機能の一覧のテストは、そのまま使う。
- 自動で確かめないこと
  - スクリーンショット：撮った後に 4 枚を開き、設定の画面に「1.0.0-rc4」が映っていること、ページのプレビューが 300 dpi の設定で描かれていることを目で確かめる。
  - ページ：ローカルのサーバーで開き、カルーセルの 4 枚が出ることを確かめる。

## トレードオフ

- 見た目がほとんど変わらないのに 4 枚を撮り直す。設定の 1 枚だけを撮り直すと、ほかの 3 枚がどの版のものかを README に分けて書くことになり、版を一つにそろえる [ADR 0002](0002-aleph-page.md) の決まりがわかりにくくなる。

## 参考文献

- [ADR 0002](0002-aleph-page.md)
- [ADR 0003](0003-golem-page-with-golem-wasm-v0-1-0-rc4.md)
- [ADR 0004](0004-aleph-page-for-v1-0-0-rc3.md)
- Aleph v1.0.0-rc4 のリリース. https://github.com/tett23/aleph/releases/tag/v1.0.0-rc4
- Aleph の v1.0.0-rc3 と v1.0.0-rc4 の差分. https://github.com/tett23/aleph/compare/v1.0.0-rc3...v1.0.0-rc4
- Aleph の ADR 0060（git を使えないとき）. https://github.com/tett23/aleph/blob/v1.0.0-rc4/docs/adr/0060-when-git-is-missing.md
- Aleph の ADR 0062（プログラムをメインスレッドの外で走らせる）. https://github.com/tett23/aleph/blob/v1.0.0-rc4/docs/adr/0062-run-programs-off-the-main-thread.md
