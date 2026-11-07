// Request and response over a Worker or MessagePort, matched by id.

type Port = {
  postMessage(msg: unknown): void;
  addEventListener(type: "message", fn: (e: MessageEvent) => void): void;
  start?(): void;
};

type Reply<Res> = { id: number; ok: true; value: Res } | { id: number; ok: false; error: string };

export const client = <Req, Res>(port: Port): (req: Req) => Promise<Res> => {
  let next = 0;
  const pending = new Map<number, { resolve(v: Res): void; reject(e: Error): void }>();
  port.addEventListener("message", (e) => {
    const r = e.data as Reply<Res>;
    const p = pending.get(r.id);
    if (!p) return;
    pending.delete(r.id);
    if (r.ok) p.resolve(r.value);
    else p.reject(new Error(r.error));
  });
  port.start?.();
  return (req) =>
    new Promise((resolve, reject) => {
      const id = next++;
      pending.set(id, { resolve, reject });
      port.postMessage({ id, req });
    });
};

export const serve = <Req, Res>(port: Port, handler: (req: Req) => Res | Promise<Res>) => {
  port.addEventListener("message", async (e) => {
    const { id, req } = e.data as { id: number; req: Req };
    try {
      port.postMessage({ id, ok: true, value: await handler(req) } satisfies Reply<Res>);
    } catch (err) {
      port.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) } satisfies Reply<Res>);
    }
  });
  port.start?.();
};
