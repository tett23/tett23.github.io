#!/bin/sh
# Assembles the site into a directory (ADR 0002).
# Usage: build-site.sh <assets-dir> <out-dir>
#   assets-dir  where fetch-assets.sh put the files of wasm.lock
set -eu

here=$(cd "$(dirname "$0")" && pwd)
site=$(cd "$here/../site" && pwd)
assets=$1
out=$2

rm -rf "$out"
mkdir -p "$out/assets"

# Static files: everything but TypeScript, notes and the lock file.
(cd "$site" && find . -type f ! -name '*.ts' ! -name 'README.md' ! -name 'wasm.lock' ! -name '.*') |
  while read -r f; do
    mkdir -p "$out/$(dirname "$f")"
    cp "$site/$f" "$out/$f"
  done

# One bundle per page entry (main.ts) and per worker (worker.ts).
(cd "$site" && find . -type f \( -name main.ts -o -name worker.ts \)) |
  while read -r entry; do
    deno bundle --quiet --platform browser --minify -o "$out/${entry%.ts}.js" "$site/$entry"
  done

# The wasm and the data files of wasm.lock, under assets/.
grep -v -e '^[[:space:]]*#' -e '^[[:space:]]*$' "$site/wasm.lock" |
  while read -r name _url _sum; do
    cp "$assets/$name" "$out/assets/$name"
  done

echo "built $out"
