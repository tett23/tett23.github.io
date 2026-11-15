# ADR 0007: adr-guard を v0.13.1 に上げ、ADR のステータスの行を新形式に移す

Status: proposed

## 文脈

このリポジトリの adr-guard は、ページを移したときに入れた（[tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md)）。
その ADR は adr-guard を入れることだけを決め、版を決めていない。
CI の `adr` ジョブは action `tett23/adr-guard@v0.10.0` を使い、`docs/specifications.md` の「ADR の検査」も v0.10.0 と書いている。
このリポジトリの ADR にも、tett23/tett23 の ADR 0008 にも、この版を決めた記述はない。

adr-guard の v0.11.0 から v0.13.1 までで、次のものが加わった。

- v0.11.0: Codex の PreToolUse hook `adr-guard codex-hook`（tett23/adr-guard の [ADR 0021](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0021-codex-hook.md)）。
- v0.12.0: ステータスの行の新形式と、状態遷移の検査（tett23/adr-guard の [ADR 0022](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0022-status-transitions.md)）。新形式は `Status: <トークン>` で、トークンは `proposed`、`accepted`、`accepted-pending`、`rejected`、`discarded`、`deprecated`、または `superseded [<変更の JSON 配列>]` である。変更は `{"part":<部分名か null>,"by":[<修正先>]}` で、修正先はリポジトリのルートからのパスである。追加した ADR と、ステータスの行を書きかえた ADR には新形式が要る。新しい ADR は最初に `Status: proposed` でコミットする。pre-commit と check-range は、最初のコミットを含めて状態遷移を検査し、その違反は書きかえの許可のオプション（`--allow-status` など）やトレーラーでは免除されない。旧形式の行はそのまま読める。旧形式を新形式に書きかえる移行スクリプト `scripts/migrate-adr-status` は adr-guard のソースにあり、リリースのアーカイブには入らない。
- v0.12.0: 修正の関係をたどる `adr-guard trace`（tett23/adr-guard の [ADR 0023](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0023-trace-amendments.md)）。
- v0.13.0: 移行スクリプトの `--dry-run` と、移行できない ADR の全件の数え上げ（tett23/adr-guard の [ADR 0024](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0024-migration-dry-run-and-error-count.md)）。
- v0.13.0: `superseded-pending`、変更の `kind` と `note`、`https://` の URL の修正先、`trace --list` の 6 列（tett23/adr-guard の [ADR 0025](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0025-extend-canonical-status-amendments.md)）。
- v0.13.0: 旧形式の参照の読み方の拡張（tett23/adr-guard の [ADR 0026](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0026-read-more-legacy-references.md)、[ADR 0027](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0027-read-legacy-replaced-status.md)）。
- v0.13.1: 移行スクリプトが旧形式の行から作る部分名の修正。部分名から修飾子（リンクのテキストの `ADR NNNN` の前の語）、先頭の `。`、末尾の `→` を除く。部分名を決められない行は「部分名を決められません」と報告し、書かない（tett23/adr-guard の [ADR 0028](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0028-fix-legacy-part-names.md)）。

手元の adr-guard はすでに 0.13.1 で、`.githooks/pre-commit` はこれを呼ぶ。
CI の action だけが v0.10.0 のままでは、手元の pre-commit と CI で検査の規則が食い違う。
状態遷移の検査は v0.12.0 で加わったので、v0.10.0 の action は状態遷移を検査せず、手元の検査を通さずに作ったコミット（`--no-verify` など）を CI が見逃す。

このリポジトリの ADR のステータスの行は、すべて旧形式（`ステータス: 採択` など）である。
旧形式の行はそのまま読めるが、書きかえるときには新形式が要る。
書きかえるたびに 1 行ずつ移すと、旧形式と新形式がいつまでも混ざるので、版を上げるときにまとめて移す。

## 調査した事項

この節のコマンドは、このリポジトリの worktree（ブランチ `adr-guard-v0.13.0`、origin/main から作成）か、その一時的な clone で実行した。

### 版と action

- `adr-guard -V` は `adr-guard 0.13.1` を出力した。
- `.github/workflows/ci.yml` の 23 行めは `uses: tett23/adr-guard@v0.10.0` である。版の指定はタグで、`version` の入力は付けていない。
- tett23/adr-guard のリポジトリで `git diff v0.10.0 v0.13.1 --stat -- action.yml` は何も出力しなかった。action の入力（`base`、`head`、`version`、`allow-status`、`allow-links`、`links`、`check-status`、`check-numbers`、`allow-renumber`）は v0.10.0 と v0.13.1 で同じである。
- `rg -n 'adr-guard@|v0\.10\.0'` で ADR の外に見つかった adr-guard の版の記述は、`.github/workflows/ci.yml` の 23 行めと、`docs/specifications.md` の 77 行め（「CI の `adr` ジョブは adr-guard v0.10.0 の action を使う。」）だけである。`README.md` は版を書いていない。
- `.githooks/pre-commit` は `exec adr-guard pre-commit --allow-status --allow-links` である。
- `git log -- .github/workflows/ci.yml .githooks` の最初のコミットは `8b486f1`（Move the product pages from tett23/tett23 (ADR 0008)）である。tett23/tett23 の ADR 0008 の「新しいリポジトリの ADR と文書」は、adr-guard を入れることだけを書き、版を書いていない。
- この ADR を足す前の `docs/adr/` の 6 つの ADR は、adr-guard に触れていない（この ADR を除いた `rg -n 'adr-guard' docs/adr` は何も出力しない）。

### 移行スクリプトの --dry-run

tett23/adr-guard の v0.13.1 のコミット（`ab55769`）を checkout した worktree でビルドした `migrate_adr_status` の example を、この worktree のルートで `--dry-run` で実行した。
`scripts/migrate-adr-status` は、この example を `cargo run --example migrate_adr_status` で動かすシェルスクリプトである。
終了コードは 0 で、標準エラーの最後の行は `移行できる: 6件、移行済み: 1件、移行できない: 0件` だった。
移行済みの 1 件は、`Status: proposed` で書いたこの ADR である。
この ADR を含まない一時的な clone では、`移行できる: 6件、移行済み: 0件、移行できない: 0件` だった。
`git status --porcelain` は何も出力せず、ファイルは変わらなかった。

差分のステータスの行は次のとおりである。
`superseded` の行は、変更を「部分名 → 修正先」で示す。

| ADR | トークン | 変更 |
|---|---|---|
| [ADR 0001](0001-golem-page-in-japanese-and-english.md) | `superseded` | `取り込む版、wasm.lock のアーカイブの欄、WASI の検査、入力のファイル、見開きの組み方` → `docs/adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md`、`関連プロジェクトの peg-hs の説明` → `docs/adr/0005-peg-hs-card-names-emet.md` |
| [ADR 0002](0002-aleph-page.md) | `superseded` | `取り込む版、wasm.lock のアーカイブの欄、WASI の検査、入力のファイル、見開きの組み方` → `docs/adr/0003-golem-page-with-golem-wasm-v0-1-0-rc4.md` |
| [ADR 0003](0003-golem-page-with-golem-wasm-v0-1-0-rc4.md) | `superseded` | `Aleph のページからリンクする版とスクリーンショットの版` → `docs/adr/0004-aleph-page-for-v1-0-0-rc3.md` |
| [ADR 0004](0004-aleph-page-for-v1-0-0-rc3.md) | `superseded` | `Aleph のページからリンクする版とスクリーンショットの版、リンクの版のテスト` → `docs/adr/0006-aleph-page-for-v1-0-0-rc4.md` |
| [ADR 0005](0005-peg-hs-card-names-emet.md) | `accepted` | |
| [ADR 0006](0006-aleph-page-for-v1-0-0-rc4.md) | `accepted` | |

部分名は旧形式の行の `は` の前の文字列のとおりで、補足や注記はない。
v0.13.0 のスクリプトの `--dry-run` の差分も、ステータスの行の 1 行ずつまで同じだった。

### 一時的な clone での試し

worktree を `$TMPDIR` に clone し、次を確かめた。

1. `--write` の後、`git add -A` してから `adr-guard pre-commit --allow-status --allow-links` を実行すると、終了コード 0 で終わった。`adr-guard check-status` と `adr-guard links` も終了コード 0 で終わった。
2. 移行をコミットした状態で `adr-guard links --fix --include-committed` を実行すると、終了コード 0 で終わり、ファイルは変わらなかった。

新しい ADR を追加するときの pre-commit の振る舞いは、SKK-JISYO.emoji-ja の worktree の一時的な clone で確かめた。
新しい ADR を `Status: accepted` で足すと、pre-commit は `許可されていない状態遷移: Absent -> accepted` で終了コード 1 になった。
`ステータス: 提案` で足すと ``新形式のステータス行は `Status: ` で始めてください`` で終了コード 1 になった。
`Status: proposed` で足すと終了コード 0 で終わった。

### いまの worktree の検査

ADR を足す前の worktree で、`adr-guard links`、`adr-guard check-status`、`adr-guard check-numbers` は終了コード 0 で終わった。

## 実装すること

- `.github/workflows/ci.yml` の `adr` ジョブの action を `uses: tett23/adr-guard@v0.13.1` にする。タグで指定する形を保ち、ほかの入力は変えない。
- ステータスの行を新形式に移す。リポジトリのルートで、tett23/adr-guard v0.13.1 のソースの `scripts/migrate-adr-status --dry-run` を実行し、結果が「調査した事項」の表と同じ 6 件で、移行済みがこの ADR の 1 件で、移行できない ADR が 0 件であることを確かめてから、`--write` で書く。移行は、ほかの変更と分けて 1 つのコミットにする。
- `docs/specifications.md` の「ADR の検査」を次のように直す。
  - CI の `adr` ジョブの adr-guard の版を v0.13.1 にし、この ADR へのリンクを付ける。
  - ステータスの行は新形式で書くことを書く。レビューの後に `Status: proposed` でコミットし、次のコミットで `accepted` か `accepted-pending` にすること、修正を受けた ADR は `superseded [...]` に部分名と修正先を書くこと、pre-commit と CI が状態遷移を検査し、`--allow-status` では免除されないことを書く。
- この ADR のステータスは、実装のプルリクエストで `accepted` にする。
- `adr-guard links --fix --include-committed` を実行し、直すものがあれば直す。

## 実装しないこと

- `.githooks/pre-commit` のコマンドは変えない（`adr-guard pre-commit --allow-status --allow-links` のまま）。Claude Code の hook は全体の設定にあり、このリポジトリには置かない。
- Codex の hook（v0.11.0 の `adr-guard codex-hook`）は足さない。
- action の `version` の入力は付けない。ほかの入力も変えない。
- 前の版を決めた ADR がないので、ステータスを `superseded` にする ADR はない。tett23/tett23 の ADR 0008 は版を決めていないので、そのステータスも変えない。
- `README.md` は変えない。README は adr-guard の版もステータスの書き方も書いていない。
- 移行した行の部分名を書きかえない。`kind` と `note` も足さない。旧形式の行に補足や注記はない。
- ADR の本文は変えない。
- 移行スクリプトをこのリポジトリに入れない。移行は一度だけ行う。

## 不変条件

なし。
CI の設定の値と、ステータスの行を移す手順だけを決める ADR で、入力によって変わる振る舞いを持たない。

## テスト設計

設定と文書の変更なので、自動テストは書かない。
実装の後に、実際に動かして確かめる。

1. 移行の前に `scripts/migrate-adr-status --dry-run` が、終了コード 0 と `移行できる: 6件、移行済み: 1件、移行できない: 0件` で終わる。
2. `--write` の後、もう一度 `--dry-run` を実行すると、`移行できる: 0件` で終わる。
3. 手元の adr-guard 0.13.1 で、`adr-guard links`、`adr-guard check-status`、`adr-guard check-numbers` が終了コード 0 で終わる。
4. `rg -n '^ステータス:' docs/adr` が何も出力しない。
5. `.github/workflows/ci.yml` が YAML として読める。
6. 各コミットで `.githooks/pre-commit` が通り、コミットの後に `adr-guard check-range origin/main HEAD --allow-status --allow-links` が終了コード 0 で終わる。
7. push の後、CI の `adr` ジョブが v0.13.1 の action で成功する。

## トレードオフ

- 新形式の `superseded` の行は JSON を含むので、旧形式より人が読みにくい。修正の関係は `adr-guard trace` で読めるので、機械で検査できるほうを選ぶ。
- すべての ADR のステータスの行をまとめて書きかえるので、1 つのコミットが全 ADR に触れる。変わるのはステータスの行だけで、移行を 1 つのコミットに分けるので、レビューでは `--dry-run` の差分と照らせる。
- 新しい ADR ごとに、`proposed` のコミットと `accepted` のコミットの 2 つが要る。状態遷移を adr-guard が検査できるようになるので、手間は受け入れる。
- 移行には tett23/adr-guard のソースと Rust のツールチェインが要る。移行は一度だけなので、スクリプトをこのリポジトリに入れない。

## 参考文献

- [adr-guard v0.11.0](https://github.com/tett23/adr-guard/releases/tag/v0.11.0)
- [adr-guard v0.12.0](https://github.com/tett23/adr-guard/releases/tag/v0.12.0)
- [adr-guard v0.13.0](https://github.com/tett23/adr-guard/releases/tag/v0.13.0)
- [adr-guard v0.13.1](https://github.com/tett23/adr-guard/releases/tag/v0.13.1)
- [adr-guard README（v0.13.1）](https://github.com/tett23/adr-guard/blob/v0.13.1/README.md)
- [tett23/adr-guard の ADR 0021「Codex の PreToolUse hook で、コミット済みのADRと記録の編集を拒否する」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0021-codex-hook.md)
- [tett23/adr-guard の ADR 0022「状態と遷移を別々の代数的データ型で表す」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0022-status-transitions.md)
- [tett23/adr-guard の ADR 0023「trace で元の決定から修正ADRをたどる」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0023-trace-amendments.md)
- [tett23/adr-guard の ADR 0024「移行スクリプトに --dry-run を設け、失敗を最後まで数える」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0024-migration-dry-run-and-error-count.md)
- [tett23/adr-guard の ADR 0025「新形式のステータス行に、実装待ちの修正、補足、注記、別のリポジトリの修正先を加える」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0025-extend-canonical-status-amendments.md)
- [tett23/adr-guard の ADR 0026「旧形式のステータス行の修正先を、リンク先と裸の番号からも読む」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0026-read-more-legacy-references.md)
- [tett23/adr-guard の ADR 0027「旧形式の `置換（…）` を、修正を受けた状態として読む」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0027-read-legacy-replaced-status.md)
- [tett23/adr-guard の ADR 0028「旧形式の部分名から修飾子と区切りの記号を除き、決められない部分名を移行しない」](https://github.com/tett23/adr-guard/blob/v0.13.1/docs/adr/0028-fix-legacy-part-names.md)
- [tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md)
