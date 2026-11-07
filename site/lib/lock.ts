// wasm.lock: one `name URL SHA-256` per line (ADR 0002).

export type LockEntry = { name: string; url: string; sha256: string };

export const readLock = (text: string): LockEntry[] =>
  text.split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .map((l) => {
      const [name, url, sha256, ...rest] = l.split(/\s+/);
      if (!sha256 || rest.length > 0 || !/^[0-9a-f]{64}$/.test(sha256)) {
        throw new Error(`wasm.lock: malformed line: ${l}`);
      }
      return { name, url, sha256 };
    });
