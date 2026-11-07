import { assertEquals } from "../lib/assert.ts";
import { type BrowserKey, MODS, translate } from "./keys.ts";

const key = (key: string, code: string, mods: Partial<BrowserKey> = {}): BrowserKey => ({
  key,
  code,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  isComposing: false,
  ...mods,
});

const { shift, ctrl, alt, meta } = MODS;

// [event, charcode, keycode, mods]: the values KeyTranslator.swift gives for
// the same physical key (NablaSKK specifications, section 12).
const table: [BrowserKey, number, number, number][] = [
  // letters
  [key("a", "KeyA"), 0x61, 0x00, 0],
  [key("s", "KeyS"), 0x73, 0x01, 0],
  [key("j", "KeyJ"), 0x6a, 0x26, 0],
  [key("k", "KeyK"), 0x6b, 0x28, 0],
  [key("l", "KeyL"), 0x6c, 0x25, 0],
  [key("q", "KeyQ"), 0x71, 0x0c, 0],
  [key("x", "KeyX"), 0x78, 0x07, 0],
  [key("z", "KeyZ"), 0x7a, 0x06, 0],
  // capitals carry Shift and the shifted character
  [key("K", "KeyK", { shiftKey: true }), 0x4b, 0x28, shift],
  [key("A", "KeyA", { shiftKey: true }), 0x41, 0x00, shift],
  [key("Q", "KeyQ", { shiftKey: true }), 0x51, 0x0c, shift],
  // some synthetic events report the unshifted letter with Shift
  [key("k", "KeyK", { shiftKey: true }), 0x4b, 0x28, shift],
  // digits
  [key("1", "Digit1"), 0x31, 0x12, 0],
  [key("5", "Digit5"), 0x35, 0x17, 0],
  [key("6", "Digit6"), 0x36, 0x16, 0],
  [key("0", "Digit0"), 0x30, 0x1d, 0],
  // symbols, plain and shifted
  [key(".", "Period"), 0x2e, 0x2f, 0],
  [key(",", "Comma"), 0x2c, 0x2b, 0],
  [key("/", "Slash"), 0x2f, 0x2c, 0],
  [key("-", "Minus"), 0x2d, 0x1b, 0],
  [key("[", "BracketLeft"), 0x5b, 0x21, 0],
  [key(";", "Semicolon"), 0x3b, 0x29, 0],
  [key("!", "Digit1", { shiftKey: true }), 0x21, 0x12, shift],
  [key("?", "Slash", { shiftKey: true }), 0x3f, 0x2c, shift],
  [key("~", "Backquote", { shiftKey: true }), 0x7e, 0x32, shift],
  // dedicated keys
  [key("Enter", "Enter"), 0x0d, 0x24, 0],
  [key("Enter", "NumpadEnter"), 0x0d, 0x4c, 0],
  [key("Tab", "Tab"), 0x09, 0x30, 0],
  [key(" ", "Space"), 0x20, 0x31, 0],
  [key(" ", "Space", { shiftKey: true }), 0x20, 0x31, shift],
  [key("Backspace", "Backspace"), 0x08, 0x33, 0],
  [key("Escape", "Escape"), 0x1b, 0x35, 0],
  [key("Delete", "Delete"), 0x7f, 0x75, 0],
  [key("ArrowLeft", "ArrowLeft"), 0, 0x7b, 0],
  [key("ArrowRight", "ArrowRight"), 0, 0x7c, 0],
  [key("ArrowDown", "ArrowDown"), 0, 0x7d, 0],
  [key("ArrowUp", "ArrowUp"), 0, 0x7e, 0],
  // Control keeps the letter (ctrl::j is "j" with ctrl), lower case even with Shift
  [key("j", "KeyJ", { ctrlKey: true }), 0x6a, 0x26, ctrl],
  [key("g", "KeyG", { ctrlKey: true }), 0x67, 0x05, ctrl],
  [key("q", "KeyQ", { ctrlKey: true }), 0x71, 0x0c, ctrl],
  [key("J", "KeyJ", { ctrlKey: true, shiftKey: true }), 0x6a, 0x26, ctrl | shift],
  [key("Enter", "Enter", { ctrlKey: true }), 0x0d, 0x24, ctrl],
  // Option: the US character of the physical key when key is not ASCII
  [key("∆", "KeyJ", { altKey: true }), 0x6a, 0x26, alt],
  [key("Ô", "KeyJ", { altKey: true, shiftKey: true }), 0x4a, 0x26, alt | shift],
  [key("v", "KeyV", { metaKey: true }), 0x76, 0x09, meta],
  // JIS keys
  [key("Lang2", "Lang2"), 0, 0x66, 0],
  [key("Lang1", "Lang1"), 0, 0x68, 0],
  [key("¥", "IntlYen"), 0, 0x5d, 0],
  // keys without a character or a macOS key code
  [key("F1", "F1"), 0, 0x7a, 0],
  [key("Unidentified", "Fn"), 0, 0xff, 0],
];

Deno.test("browser keys translate as KeyTranslator.swift does", () => {
  for (const [ev, charcode, keycode, mods] of table) {
    assertEquals(translate(ev), { kind: "key", charcode, keycode, mods }, `${ev.key} ${ev.code}`);
  }
});

Deno.test("modifier bits", () => {
  assertEquals(MODS, { shift: 2, ctrl: 4, alt: 8, meta: 16 });
});

Deno.test("events while the OS input method is composing are not passed", () => {
  assertEquals(translate(key("k", "KeyK", { isComposing: true })), { kind: "composing" });
  assertEquals(translate(key("Process", "KeyK")), { kind: "composing" });
});

Deno.test("modifier keys alone are ignored", () => {
  for (const k of ["Shift", "Control", "Alt", "Meta", "CapsLock"]) {
    assertEquals(translate(key(k, `${k}Left`)), { kind: "ignore" });
  }
});
