// Checks a built site (tett23/tett23 ADR 0002, ADR 0008): every same-site href/src/url() resolves to a
// file, and nothing but links points to another origin.
// Usage: deno run --allow-read check-site.ts <site-dir>

const BASE = "/";

type Ref = { url: string; tag: string };

const attrRe = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const tagRe = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
const cssUrlRe = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)|@import\s+(?:"([^"]*)"|'([^']*)')/gi;
const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

const first = (m: RegExpMatchArray, from: number) => m.slice(from).find((x) => x !== undefined) ?? "";

const htmlRefs = (html: string): Ref[] => [
  ...[...html.matchAll(tagRe)].flatMap((t) =>
    [...t[2].matchAll(attrRe)].map((a) => ({ url: first(a, 1), tag: t[1].toLowerCase() }))
  ),
  ...[...html.matchAll(styleRe)].flatMap((s) => cssRefs(s[1])),
];

const cssRefs = (css: string): Ref[] => [...css.matchAll(cssUrlRe)].map((m) => ({ url: first(m, 1), tag: "css" }));

const isExternal = (url: string) => /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url);
const isIgnored = (url: string) => url === "" || url.startsWith("#") || /^(?:data|mailto|javascript|blob):/i.test(url);

const exists = async (path: string) => {
  try {
    const s = await Deno.stat(path);
    return s.isFile || (s.isDirectory && (await Deno.stat(`${path}/index.html`).then(() => true, () => false)));
  } catch {
    return false;
  }
};

const walk = async function* (dir: string, prefix = ""): AsyncGenerator<string> {
  for await (const e of Deno.readDir(dir)) {
    const rel = prefix + e.name;
    if (e.isDirectory) yield* walk(`${dir}/${e.name}`, `${rel}/`);
    else yield rel;
  }
};

const resolve = (root: string, file: string, url: string): string | undefined => {
  const path = decodeURIComponent(url.replace(/[?#].*$/, ""));
  if (path.startsWith("/")) {
    return path.startsWith(BASE) ? `${root}/${path.slice(BASE.length)}` : undefined;
  }
  const dir = file.includes("/") ? file.replace(/\/[^/]*$/, "") : "";
  const parts = `${dir}/${path}`.split("/").reduce<string[]>((acc, p) => {
    if (p === "..") acc.pop();
    else if (p !== "." && p !== "") acc.push(p);
    return acc;
  }, []);
  return `${root}/${parts.join("/")}`;
};

export const checkSite = async (root: string): Promise<string[]> => {
  const errors: string[] = [];
  for await (const file of walk(root)) {
    const refs = file.endsWith(".html")
      ? htmlRefs(await Deno.readTextFile(`${root}/${file}`))
      : file.endsWith(".css")
      ? cssRefs(await Deno.readTextFile(`${root}/${file}`))
      : [];
    for (const { url, tag } of refs) {
      if (isIgnored(url)) continue;
      if (isExternal(url)) {
        if (tag !== "a") errors.push(`${file}: external ${url}`);
        continue;
      }
      const target = resolve(root, file, url);
      if (!target || !(await exists(target))) errors.push(`${file}: missing ${url}`);
    }
  }
  return errors;
};

if (import.meta.main) {
  const errors = await checkSite(Deno.args[0] ?? "_site");
  errors.forEach((e) => console.error(e));
  if (errors.length > 0) Deno.exit(1);
  console.log("site ok");
}
