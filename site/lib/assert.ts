// Minimal assertions for `deno test`, so the tests need no dependency.

export const assert: (cond: unknown, msg?: string) => asserts cond = (cond, msg) => {
  if (!cond) throw new Error(msg ?? "assertion failed");
};

const equal = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
    const x = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    const y = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    return x.length === y.length && x.every((v, i) => v === y[i]);
  }
  if (a instanceof Map && b instanceof Map) {
    return a.size === b.size && [...a].every(([k, v]) => b.has(k) && equal(v, b.get(k)));
  }
  if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((v) => b.has(v));
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length &&
    ka.every((k) => equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

const show = (v: unknown) =>
  ArrayBuffer.isView(v) ? `${v.constructor.name}(${v.byteLength})` : Deno.inspect(v, { depth: 6 });

export const assertEquals = <T>(actual: T, expected: T, msg?: string) => {
  if (!equal(actual, expected)) {
    throw new Error(`${msg ? msg + ": " : ""}expected ${show(expected)}, got ${show(actual)}`);
  }
};

export const assertMatch = (actual: string, re: RegExp) => {
  if (!re.test(actual)) throw new Error(`expected ${Deno.inspect(actual)} to match ${re}`);
};

export const assertThrows = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error("expected the function to throw");
};

export const assertRejects = async (
  fn: () => Promise<unknown>,
  // deno-lint-ignore no-explicit-any
  type?: abstract new (...args: any[]) => Error,
  includes?: string,
): Promise<unknown> => {
  try {
    await fn();
  } catch (e) {
    if (type && !(e instanceof type)) throw new Error(`expected ${type.name}, got ${show(e)}`);
    if (includes && !String((e as Error).message).includes(includes)) {
      throw new Error(`expected message to include ${Deno.inspect(includes)}, got ${show(e)}`);
    }
    return e;
  }
  throw new Error("expected the promise to reject");
};
