const list = await (await fetch("http://127.0.0.1:9247/json/list")).json();
const page = list.find((t) => t.type === "page" && t.url.includes("suzuka"));
if (!page) process.exit(1);
const ws = new WebSocket(page.webSocketDebuggerUrl);
let seq = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Page.enable");
await send("Page.navigate", { url: "https://suzuka.moe/posts/cookie-and-cream/?nocache=" + Date.now() });
await sleep(5000);

const res = await send("Runtime.evaluate", {
  expression: `(async () => {
    await document.fonts.ready;
    const fonts = performance.getEntriesByType('resource').filter(r => r.name.includes('woff2'));
    const cv = document.createElement('canvas').getContext('2d');
    const m = (s, t) => { cv.font = '100px ' + s; return +cv.measureText(t).width.toFixed(1); };
    return {
      字体请求: fonts.map(r => ({ f: r.name.split('/').pop(), kb: Math.round((r.encodedBodySize||r.transferSize)/1024) })),
      假名宽度_圆体: m('"ChillRoundF"', 'きみが'),
      假名宽度_后备: m('"Roboto"', 'きみが'),
      数字宽度_圆体: m('"ChillRoundF"', '2026'),
      数字宽度_后备: m('"Roboto"', '2026'),
    };
  })()`, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(res.result?.result?.value, null, 2));
ws.close();
