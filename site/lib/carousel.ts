// A WAI-ARIA carousel with tabs, shared by the NablaSKK and the Aleph pages
// (tett23/tett23 ADR 0003, ADR 0002).
// No automatic rotation. Without scripts the slides scroll sideways.

export type CarouselAction =
  | { type: "next" }
  | { type: "prev" }
  | { type: "go"; index: number }
  | { type: "key"; key: string };

const clamp = (i: number, count: number) => Math.max(0, Math.min(count - 1, i));

export const step = (index: number, count: number, a: CarouselAction): number => {
  switch (a.type) {
    case "next":
      return clamp(index + 1, count);
    case "prev":
      return clamp(index - 1, count);
    case "go":
      return clamp(a.index, count);
    case "key":
      return a.key === "ArrowRight"
        ? clamp(index + 1, count)
        : a.key === "ArrowLeft"
        ? clamp(index - 1, count)
        : a.key === "Home"
        ? 0
        : a.key === "End"
        ? count - 1
        : index;
  }
};

export const tabAttributes = (index: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ selected: i === index, tabIndex: i === index ? 0 : -1 }));

/** Wires a carousel rendered as in nablaskk/index.html and aleph/index.html. */
export const mountCarousel = (root: HTMLElement) => {
  const track = root.querySelector<HTMLElement>("[data-track]")!;
  const slides = [...root.querySelectorAll<HTMLElement>("[data-slide]")];
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const prev = root.querySelector<HTMLButtonElement>("[data-prev]")!;
  const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
  const counter = root.querySelector<HTMLElement>("[data-counter]")!;
  let index = 0;

  root.classList.add("js");
  const render = (focusTab: boolean) => {
    tabAttributes(index, slides.length).forEach((a, i) => {
      tabs[i].setAttribute("aria-selected", String(a.selected));
      tabs[i].tabIndex = a.tabIndex;
      slides[i].hidden = !a.selected;
    });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    counter.textContent = `${index + 1} / ${slides.length}`;
    track.scrollLeft = 0;
    if (focusTab) tabs[index].focus();
  };
  const dispatch = (a: CarouselAction, focusTab = false) => {
    index = step(index, slides.length, a);
    render(focusTab);
  };

  prev.addEventListener("click", () => dispatch({ type: "prev" }));
  next.addEventListener("click", () => dispatch({ type: "next" }));
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => dispatch({ type: "go", index: i }));
    t.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        dispatch({ type: "key", key: e.key }, true);
      }
    });
  });
  render(false);
};
