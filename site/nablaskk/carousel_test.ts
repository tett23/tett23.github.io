import { assertEquals } from "../lib/assert.ts";
import { type CarouselAction, step, tabAttributes } from "./carousel.ts";

const run = (count: number, actions: CarouselAction[], from = 0) => actions.reduce((i, a) => step(i, count, a), from);

Deno.test("next and previous move one slide", () => {
  assertEquals(run(6, [{ type: "next" }]), 1);
  assertEquals(run(6, [{ type: "next" }, { type: "next" }, { type: "prev" }]), 1);
});

Deno.test("it stops at the first and the last slide", () => {
  assertEquals(run(6, [{ type: "prev" }]), 0);
  assertEquals(run(6, Array(10).fill({ type: "next" })), 5);
});

Deno.test("tabs go to their slide", () => {
  assertEquals(run(6, [{ type: "go", index: 4 }]), 4);
  assertEquals(run(6, [{ type: "go", index: 9 }]), 5);
  assertEquals(run(6, [{ type: "go", index: -1 }]), 0);
});

Deno.test("arrow keys move like the buttons; other keys do nothing", () => {
  assertEquals(run(6, [{ type: "key", key: "ArrowRight" }, { type: "key", key: "ArrowRight" }]), 2);
  assertEquals(run(6, [{ type: "key", key: "ArrowLeft" }], 3), 2);
  assertEquals(run(6, [{ type: "key", key: "Home" }], 3), 0);
  assertEquals(run(6, [{ type: "key", key: "End" }], 3), 5);
  assertEquals(run(6, [{ type: "key", key: "a" }], 3), 3);
  assertEquals(run(6, [{ type: "key", key: "ArrowLeft" }], 0), 0);
  assertEquals(run(6, [{ type: "key", key: "ArrowRight" }], 5), 5);
});

Deno.test("only the shown slide's tab is selected and focusable", () => {
  assertEquals(tabAttributes(2, 4), [
    { selected: false, tabIndex: -1 },
    { selected: false, tabIndex: -1 },
    { selected: true, tabIndex: 0 },
    { selected: false, tabIndex: -1 },
  ]);
});
