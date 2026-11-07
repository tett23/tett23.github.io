import { assertEquals, assertRejects } from "./assert.ts";
import { client, serve } from "./rpc.ts";

Deno.test("requests are answered in order of their ids, not of arrival", async () => {
  const { port1, port2 } = new MessageChannel();
  serve<number, number>(port2, async (n) => {
    await new Promise((r) => setTimeout(r, n));
    return n * 2;
  });
  const call = client<number, number>(port1);
  assertEquals(await Promise.all([call(30), call(1), call(10)]), [60, 2, 20]);
  port1.close();
  port2.close();
});

Deno.test("an error in the handler rejects the call", async () => {
  const { port1, port2 } = new MessageChannel();
  serve<string, string>(port2, (s) => {
    throw new Error(`bad ${s}`);
  });
  const call = client<string, string>(port1);
  await assertRejects(() => call("x"), Error, "bad x");
  port1.close();
  port2.close();
});
