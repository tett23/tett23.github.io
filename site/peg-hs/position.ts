// peg-hs counts columns in code points from 1; textareas count UTF-16 units.

export const offsetOf = (text: string, line: number, column: number): number => {
  const lines = text.split("\n");
  if (line > lines.length) return text.length;
  const l = Math.max(line, 1);
  const before = lines.slice(0, l - 1).reduce((n, s) => n + s.length + 1, 0);
  const prefix = [...lines[l - 1]].slice(0, Math.max(column, 1) - 1).join("");
  return Math.min(before + prefix.length, text.length);
};
