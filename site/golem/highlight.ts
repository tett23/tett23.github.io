// Marks the commands in the source box (ADR 0001): the brackets and names of .gm commands, block
// commands and headings, and the tables and comments of TOML. The result goes into a <pre> behind
// the textarea, so it keeps every character and ends with a newline like the textarea's last line.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const span = (cls: string, s: string) => `<span class="${cls}">${esc(s)}</span>`;

const gmLine = (line: string) => {
  if (/^#+ /.test(line)) return span("h", line);
  if (/^@\S/.test(line)) {
    const [, cmd, rest] = line.match(/^(@\S+)(.*)$/)!;
    return span("m", cmd) + gmInline(rest);
  }
  return gmInline(line);
};

const gmInline = (s: string) => {
  let depth = 0;
  return s.split(/(\[[a-z][a-z0-9.-]*:?|\]|\|)/).map((part, i) => {
    if (i % 2 === 0) return esc(part);
    if (part.startsWith("[")) {
      depth++;
      return span("m", part);
    }
    if (depth === 0) return esc(part);
    if (part === "]") depth--;
    return span("m", part);
  }).join("");
};

const tomlLine = (line: string) => {
  if (/^\s*\[.*\]\s*$/.test(line)) return span("m", line);
  const m = line.match(/^([^"#]*(?:"[^"]*"[^"#]*)*)(#.*)$/);
  return m ? esc(m[1]) + span("c", m[2]) : esc(line);
};

export const highlight = (file: string, text: string): string =>
  text.split("\n").map(file.endsWith(".toml") ? tomlLine : gmLine).join("\n") + "\n";
