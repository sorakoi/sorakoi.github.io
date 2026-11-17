const list = await (await fetch("http://127.0.0.1:9247/json/list")).json();
const page = list.find((t) => t.type === "page" && t.url.includes("suzuka"));
if (!page) { console.log("no page:", list.map(t=>t.url)); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let seq = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await new Promise((r) => ws.addEventListener("open", r));
await send("Runtime.enable");
await sleep(4500);

const res = await send("Runtime.evaluate", {
  expression: `(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family);
    const cv = document.createElement('canvas').getContext('2d');
    const m = (s, t) => { cv.font = '100px ' + s; return +cv.measureText(t).width.toFixed(1); };
    const fontRes = performance.getEntriesByType('resource').filter(r => r.name.includes('woff2')).map(r => ({ f: r.name.split('/').pop(), kb: Math.round(r.transferSize/1024) }));
    return {
      地址: location.href,
      已加载字体: loaded,
      body字体: getComputedStyle(document.body).fontFamily.slice(0, 50),
      宽度_圆体: m('"ChillRoundF"', '这是Cookie2026'),
      宽度_后备: m('"Roboto"', '这是Cookie2026'),
      字体请求: fontRes,
    };
  })()`, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(res.result?.result?.value, null, 2));
ws.close();
