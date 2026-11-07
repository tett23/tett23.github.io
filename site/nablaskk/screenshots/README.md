# 設定アプリのスクリーンショット

[ADR 0003](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0003-nablaskk-page.md) のカルーセルに使う、NablaSKK の設定アプリの 6 つのページの画像。

## 撮り方

- 版：NablaSKK 1.3.0（de03846）。リリースのアプリを `~/Library/Input Methods` に入れたもの。
- 撮った日：2026-11-08。
- macOS をライトモードにし、設定アプリ（`NablaSKK.app/Contents/Resources/NablaSKK Preferences.app`）を開く。
- ウィンドウの大きさは 1278 × 728 ポイント（等倍の画面で撮ったので、画像も 1278 × 728 画素）。
- サイドバーで各ページを開き、`screencapture -x -o -l <ウィンドウ ID>` でウィンドウだけを影なしで撮る。
- 設定は作者の普段のもの（辞書は SKK-JISYO.L と作者の辞書、追加したローマ字かなルール、ユーザー辞書）。

| ファイル | ページ |
| --- | --- |
| `dictionaries.png` | 辞書 |
| `user-dictionary.png` | ユーザー辞書 |
| `skkserv.png` | skkserv |
| `input.png` | 入力 |
| `roman.png` | ローマ字 |
| `keys.png` | キー |

版を上げて見た目が変わったら、同じ手順で撮り直す。
