# tett23.github.io

tett23 のプロダクトのページを置く GitHub Pages のユーザーサイト。

- https://tett23.github.io/ — 目次
- https://tett23.github.io/nablaskk/ — NablaSKK（日本語）
- https://tett23.github.io/peg-hs/ — peg-hs（英語）

仕様は [docs/specifications.md](docs/specifications.md) にある。
ページは [tett23/tett23](https://github.com/tett23/tett23) に置いていたものを、[tett23/tett23 の ADR 0008](https://github.com/tett23/tett23/blob/main/.github/docs/adr/0008-move-product-pages-to-user-site.md) で移した。
移したときの元のコミットは tett23/tett23 の `63431fcbac87ea6c042908ffc71b3a70ad7fc2a5` で、それまでの履歴はそちらにある。

## 開発

クローン後、git の hook を有効にする。コミット済みの ADR の変更は [adr-guard](https://github.com/tett23/adr-guard) で拒否する。

```sh
git config core.hooksPath .githooks
```

Deno 2 が要る。

```sh
sh scripts/fetch-assets.sh site/wasm.lock _assets
deno task check && deno lint && deno fmt --check && deno task test
sh scripts/build-site.sh _assets _site
deno run --allow-read scripts/check-site.ts _site
```

手元で見るときは、`_site/` を静的なファイルのサーバーで配信する。wasm を `fetch` で読むので、`file://` では開けない。

設計判断は `docs/adr/` に ADR として記録する。

## License

[MIT](LICENSE)。ただし、`site/nablaskk/AppIcon.svg` と `site/nablaskk/screenshots/` は NablaSKK のもので、GPL-2.0-or-later である。
