#!/bin/sh
# Fetches the files listed in wasm.lock into a directory and checks their
# SHA-256 (tett23/tett23 ADR 0002). A line with a fourth field takes that
# path out of a tar.gz, and the SHA-256 is that of the file (ADR 0003).
# Usage: fetch-assets.sh <wasm.lock> <out-dir>
set -eu

lock=$1
out=$2
mkdir -p "$out"

sha256() {
  shasum -a 256 "$1" | cut -d ' ' -f 1
}

grep -v -e '^[[:space:]]*#' -e '^[[:space:]]*$' "$lock" | while read -r name url sum member; do
  dest="$out/$name"
  if [ -f "$dest" ] && [ "$(sha256 "$dest")" = "$sum" ]; then
    echo "ok (cached) $name"
    continue
  fi
  rm -f "$dest"
  tmp="$out/.$name.part"
  if [ -n "$member" ]; then
    work=$(mktemp -d)
    if ! curl -fsSL --retry 3 -o "$work/archive.tar.gz" "$url"; then
      rm -rf "$work"
      echo "error: could not fetch $name from $url" >&2
      exit 1
    fi
    if ! tar -xzf "$work/archive.tar.gz" -C "$work" "$member" 2>/dev/null || [ ! -f "$work/$member" ]; then
      rm -rf "$work"
      echo "error: $url has no $member for $name" >&2
      exit 1
    fi
    mv "$work/$member" "$tmp"
    rm -rf "$work"
  elif ! curl -fsSL --retry 3 -o "$tmp" "$url"; then
    rm -f "$tmp"
    echo "error: could not fetch $name from $url" >&2
    exit 1
  fi
  actual=$(sha256 "$tmp")
  if [ "$actual" != "$sum" ]; then
    rm -f "$tmp"
    echo "error: SHA-256 mismatch for $name: expected $sum, got $actual" >&2
    exit 1
  fi
  mv "$tmp" "$dest"
  echo "ok $name"
done
