// shem.wasm: rasterizes the pages of a PDF (shem v0.1.0-rc7, tett23/tett23 ADR 0006).

type Exports = {
  memory: WebAssembly.Memory;
  shem_alloc(len: number): number;
  shem_free(p: number): void;
  shem_open(p: number, len: number, dpi: number): number;
  shem_page_count(doc: number): number;
  shem_render(doc: number, page: number): number;
  shem_image_ptr(doc: number): number;
  shem_image_width(doc: number): number;
  shem_image_height(doc: number): number;
  shem_close(doc: number): void;
  shem_error_ptr(): number;
  shem_error_len(): number;
};

export type Image = { width: number; height: number; rgba: Uint8ClampedArray<ArrayBuffer> };
export type Doc = { pageCount: number; render(page: number): Image; close(): void };
export type Shem = { open(pdf: Uint8Array, dpi: number): Doc };

export const loadShem = async (module: WebAssembly.Module): Promise<Shem> => {
  const ex = (await WebAssembly.instantiate(module, {})).exports as unknown as Exports;
  const error = () =>
    new Error(
      "shem: " +
        new TextDecoder().decode(new Uint8Array(ex.memory.buffer, ex.shem_error_ptr(), ex.shem_error_len())),
    );
  return {
    open: (pdf, dpi) => {
      const p = ex.shem_alloc(pdf.length);
      if (p === 0) throw error();
      new Uint8Array(ex.memory.buffer, p, pdf.length).set(pdf);
      const doc = ex.shem_open(p, pdf.length, dpi);
      ex.shem_free(p);
      if (doc === 0) throw error();
      return {
        pageCount: ex.shem_page_count(doc),
        render: (page) => {
          if (ex.shem_render(doc, page) === 0) throw error();
          const width = ex.shem_image_width(doc);
          const height = ex.shem_image_height(doc);
          const rgba = new Uint8ClampedArray(ex.memory.buffer, ex.shem_image_ptr(doc), width * height * 4).slice();
          return { width, height, rgba };
        },
        close: () => ex.shem_close(doc),
      };
    },
  };
};
