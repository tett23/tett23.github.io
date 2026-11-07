// Share links: the grammar, deflated and base64url-encoded, in the fragment
// `#g=`. Fragments are not sent to the server (ADR 0004).

const pipe = async (bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

const toBase64Url = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

const fromBase64Url = (s: string) => {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("not base64url");
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export const encodeGrammar = async (grammar: string): Promise<string> =>
  toBase64Url(await pipe(new TextEncoder().encode(grammar), new CompressionStream("deflate-raw")));

export const decodeGrammar = async (encoded: string): Promise<string> =>
  new TextDecoder("utf-8", { fatal: true }).decode(
    await pipe(fromBase64Url(encoded), new DecompressionStream("deflate-raw")),
  );

export type Fragment = { kind: "none" } | { kind: "grammar"; grammar: string } | { kind: "broken" };

export const readFragment = async (hash: string): Promise<Fragment> => {
  const m = /^#g=(.*)$/.exec(hash);
  if (!m) return { kind: "none" };
  try {
    return { kind: "grammar", grammar: await decodeGrammar(m[1]) };
  } catch {
    return { kind: "broken" };
  }
};

export const shareUrl = async (pageUrl: string, grammar: string): Promise<string> => {
  const u = new URL(pageUrl);
  u.hash = `g=${await encodeGrammar(grammar)}`;
  return u.toString();
};
