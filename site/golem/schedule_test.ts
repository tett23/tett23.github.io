import { assertEquals } from "../lib/assert.ts";
import { createScheduler } from "./schedule.ts";

// A fake clock: timers fire only when the test advances time.
const fakeClock = () => {
  let now = 0;
  let next = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    setTimer: (fn: () => void, ms: number) => {
      const id = ++next;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimer: (id: number) => void timers.delete(id),
    advance: (ms: number) => {
      now += ms;
      [...timers].filter(([, t]) => t.at <= now).forEach(([id, t]) => {
        timers.delete(id);
        t.fn();
      });
    },
  };
};

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

const tick = () => new Promise((r) => setTimeout(r, 0));

Deno.test("changes within 500 ms build once, with the last input", async () => {
  const clock = fakeClock();
  const runs: string[] = [];
  const shown: string[] = [];
  const s = createScheduler<string, string>({
    delay: 500,
    run: (x) => (runs.push(x), Promise.resolve(x.toUpperCase())),
    show: (r) => shown.push(r),
    ...clock,
  });
  s.change("a");
  clock.advance(200);
  s.change("ab");
  clock.advance(499);
  assertEquals(runs, []);
  clock.advance(1);
  await tick();
  assertEquals(runs, ["ab"]);
  assertEquals(shown, ["AB"]);
});

Deno.test("a change while building throws the old result away and shows only the last", async () => {
  const clock = fakeClock();
  const runs: string[] = [];
  const shown: string[] = [];
  const pending = new Map<string, ReturnType<typeof deferred<string>>>();
  const s = createScheduler<string, string>({
    delay: 500,
    run: (x) => {
      runs.push(x);
      const d = deferred<string>();
      pending.set(x, d);
      return d.promise;
    },
    show: (r) => shown.push(r),
    ...clock,
  });
  s.change("old");
  clock.advance(500);
  assertEquals(runs, ["old"]);
  s.change("mid");
  clock.advance(500);
  s.change("new");
  clock.advance(500);
  // Only one build runs at a time; nothing more starts until "old" ends.
  assertEquals(runs, ["old"]);
  pending.get("old")!.resolve("OLD");
  await tick();
  assertEquals(shown, []);
  assertEquals(runs, ["old", "new"]);
  pending.get("new")!.resolve("NEW");
  await tick();
  assertEquals(shown, ["NEW"]);
});

Deno.test("now builds at once, without waiting", async () => {
  const clock = fakeClock();
  const runs: string[] = [];
  const s = createScheduler<string, string>({
    delay: 500,
    run: (x) => (runs.push(x), Promise.resolve(x)),
    show: () => {},
    ...clock,
  });
  s.now("first");
  await tick();
  assertEquals(runs, ["first"]);
});
