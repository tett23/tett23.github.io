// The size of a page's canvas (tett23/tett23 ADR 0006: the 300 dpi page is shrunk to the frame).
// Drawing at the shown width times the pixel ratio, with high-quality smoothing, shrinks the page
// once and well; letting the browser shrink a 1512-pixel canvas to a few hundred pixels breaks
// the thin strokes of the characters.

export const fitCanvas = (shownWidth: number, ratio: number, pageWidth: number, pageHeight: number) => {
  const width = shownWidth > 0 ? Math.min(pageWidth, Math.round(shownWidth * ratio)) : pageWidth;
  return { width, height: Math.round(width * pageHeight / pageWidth) };
};
