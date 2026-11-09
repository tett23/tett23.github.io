// Builds 500 ms after the last change, one build at a time; a result whose input is no longer the
// last one is thrown away (tett23/tett23 ADR 0005).

export type SchedulerOptions<T, R> = {
  delay: number;
  run: (input: T) => Promise<R>;
  show: (result: R, input: T) => void;
  fail?: (error: unknown) => void;
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
};

export const createScheduler = <T, R>(o: SchedulerOptions<T, R>) => {
  const setTimer = o.setTimer ?? ((fn, ms) => setTimeout(fn, ms) as unknown as number);
  const clearTimer = o.clearTimer ?? ((id) => clearTimeout(id));
  let timer: number | undefined;
  let latest = 0;
  let running = false;
  let queued: { input: T; gen: number } | undefined;

  const start = (input: T, gen: number) => {
    running = true;
    o.run(input).then(
      (r) => gen === latest && o.show(r, input),
      (e) => gen === latest && o.fail?.(e),
    ).finally(() => {
      running = false;
      const q = queued;
      queued = undefined;
      if (q && q.gen === latest) start(q.input, q.gen);
    });
  };

  const fire = (input: T, gen: number) => {
    if (running) queued = { input, gen };
    else start(input, gen);
  };

  return {
    change: (input: T) => {
      const gen = ++latest;
      if (timer !== undefined) clearTimer(timer);
      timer = setTimer(() => {
        timer = undefined;
        fire(input, gen);
      }, o.delay);
    },
    now: (input: T) => {
      const gen = ++latest;
      if (timer !== undefined) clearTimer(timer);
      timer = undefined;
      fire(input, gen);
    },
  };
};
