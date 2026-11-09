// wasm.lock: one `name URL SHA-256 [path-in-archive]` per line (tett23/tett23 ADR 0002, ADR 0003).
// With the fourth field, the URL is a tar.gz and the SHA-256 is that of the file taken out of it.

export type LockEntry = { name: string; url: string; sha256: string; member?: string };

export const readLock = (text: string): LockEntry[] =>
  text.split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .map((l) => {
      const [name, url, sha256, member, ...rest] = l.split(/\s+/);
      if (!sha256 || rest.length > 0 || !/^[0-9a-f]{64}$/.test(sha256)) {
        throw new Error(`wasm.lock: malformed line: ${l}`);
      }
      return member === undefined ? { name, url, sha256 } : { name, url, sha256, member };
    });
