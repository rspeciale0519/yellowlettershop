#!/usr/bin/env node
/**
 * Headless Chrome via CDP for verify-yls interactive drives.
 * Uses system Chrome. Closes the browser itself (this VM hangs on dbus if we
 * leave Chrome running after --screenshot).
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function stopProcessGroup(child) {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result || {});
      }
    };
  }

  send(method, params = {}, timeoutMs = 15000) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

export async function launchChromeSession({
  chromePath,
  userDataDir,
  port = 0,
} = {}) {
  await mkdir(userDataDir, { recursive: true });
  let stderr = '';
  const child = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--use-gl=angle',
      '--use-angle=swiftshader-webgl',
      '--window-size=1280,1400',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${userDataDir}`,
      '--remote-allow-origins=*',
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'], detached: true },
  );
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  let debugPort = port;
  const started = Date.now();
  while (Date.now() - started < 15000) {
    const match = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
    if (match) {
      debugPort = Number(match[1]);
      break;
    }
    await sleep(100);
  }
  if (!debugPort) {
    stopProcessGroup(child);
    throw new Error(`Chrome DevTools port not found. stderr=${stderr.slice(-400)}`);
  }

  let ready = false;
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      // still booting
    }
    await sleep(250);
  }
  if (!ready) {
    stopProcessGroup(child);
    throw new Error(`Chrome DevTools did not come up on :${debugPort}`);
  }
  port = debugPort;

  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await listRes.json();
  const page = targets.find((t) => t.type === 'page') || targets[0];
  if (!page?.webSocketDebuggerUrl) {
    stopProcessGroup(child);
    throw new Error('Chrome had no page target');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('CDP websocket failed'));
  });
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Network.enable');
  await cdp.send('Target.setDiscoverTargets', { discover: true });

  const session = {
    child,
    cdp,
    ws,
    port,
    async attachTarget(targetId) {
      let wsUrl;
      for (let i = 0; i < 40; i += 1) {
        const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
        const target = list.find((t) => t.id === targetId);
        if (target?.webSocketDebuggerUrl) {
          wsUrl = target.webSocketDebuggerUrl;
          break;
        }
        await sleep(100);
      }
      if (!wsUrl) {
        throw new Error(`no DevTools websocket for target ${targetId}`);
      }
      const nextWs = new WebSocket(wsUrl);
      await new Promise((resolve, reject) => {
        nextWs.onopen = resolve;
        nextWs.onerror = () => reject(new Error('CDP websocket failed for new target'));
      });
      const nextCdp = new Cdp(nextWs);
      await nextCdp.send('Page.enable');
      await nextCdp.send('Runtime.enable');
      await nextCdp.send('DOM.enable');
      await nextCdp.send('Network.enable');
      return createPage({
        child,
        cdp: nextCdp,
        ws: nextWs,
        port,
        async close() {
          try {
            await nextCdp.send('Page.close');
          } catch {
            // ignore
          }
        },
      });
    },
    async openUrl(url) {
      const { targetId } = await cdp.send('Target.createTarget', { url });
      const page = await this.attachTarget(targetId);
      const start = Date.now();
      while (Date.now() - start < 20000) {
        try {
          const ready = await page.evaluate('document.readyState');
          if (ready === 'complete' || ready === 'interactive') break;
        } catch {
          // execution context not ready yet
        }
        await sleep(200);
      }
      return page;
    },
    async close() {
      try {
        await cdp.send('Browser.close');
      } catch {
        // ignore
      }
      try {
        ws.close();
      } catch {
        // ignore
      }
      await sleep(200);
      stopProcessGroup(child);
    },
  };
  return session;
}

function jsString(value) {
  return JSON.stringify(value);
}

export function createPage(session) {
  const { cdp } = session;

  async function evaluate(expression) {
    try {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        const text = result.exceptionDetails.text || 'evaluate failed';
        throw new Error(text);
      }
      return result.result?.value;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/context|navigated|destroyed/i.test(msg)) throw err;
      await sleep(400);
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text || 'evaluate failed');
      }
      return result.result?.value;
    }
  }

  async function goto(url, { timeoutMs = 30000, matchSearch = false } = {}) {
    const want = new URL(url, 'http://127.0.0.1:3010');
    await cdp.send('Page.navigate', { url: want.href });
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const here = await evaluate(
          `({ href: location.href, path: location.pathname, search: location.search, ready: document.readyState })`,
        );
        if (
          here &&
          here.path === want.pathname &&
          (!matchSearch || here.search === want.search) &&
          (here.ready === 'complete' || here.ready === 'interactive')
        ) {
          return;
        }
      } catch {
        // document still swapping
      }
      await sleep(200);
    }
    const here = await evaluate('location.href').catch(() => 'unknown');
    throw new Error(`navigate timed out: wanted ${want.href}, at ${here}`);
  }

  async function load(url) {
    await cdp.send('Page.navigate', { url });
    const start = Date.now();
    while (Date.now() - start < 20000) {
      try {
        const ready = await evaluate('document.readyState');
        if (ready === 'complete' || ready === 'interactive') return;
      } catch {
        // swapping
      }
      await sleep(200);
    }
  }

  async function waitFor(expression, { timeoutMs = 20000, message } = {}) {
    // Coerce DOM nodes / objects to true so CDP returnByValue does not throw
    // "Object reference chain is too long".
    const wrapped = `(() => { const __v = (${expression}); return (typeof __v === "object" && __v !== null) ? true : __v; })()`;
    const start = Date.now();
    let last;
    while (Date.now() - start < timeoutMs) {
      last = await evaluate(wrapped);
      if (last) return last;
      await sleep(250);
    }
    throw new Error(message || `waitFor timed out: ${expression} (last=${last})`);
  }

  async function click(selector) {
    const found = await evaluate(`
      (() => {
        const el = document.querySelector(${jsString(selector)});
        if (!el) return false;
        el.click();
        return true;
      })()
    `);
    if (!found) throw new Error(`click: no element ${selector}`);
  }

  async function clickText(tag, text) {
    const found = await evaluate(`
      (() => {
        const nodes = Array.from(document.querySelectorAll(${jsString(tag)}));
        const el = nodes.find((n) => (n.textContent || '').trim().includes(${jsString(text)}));
        if (!el) return false;
        el.click();
        return true;
      })()
    `);
    if (!found) throw new Error(`clickText: no ${tag} containing ${JSON.stringify(text)}`);
  }

  async function fill(selector, value) {
    const ok = await evaluate(`
      (() => {
        const el = document.querySelector(${jsString(selector)});
        if (!el) return false;
        const proto = el instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        desc.set.call(el, ${jsString(value)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()
    `);
    if (!ok) throw new Error(`fill: no element ${selector}`);
  }

  async function screenshot(destPng) {
    let result;
    try {
      result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }, 20000);
    } catch {
      result = await cdp.send('Page.captureScreenshot', { format: 'png' }, 20000);
    }
    await mkdir(path.dirname(destPng), { recursive: true });
    await writeFile(destPng, Buffer.from(result.data, 'base64'));
  }

  async function html() {
    return evaluate('document.documentElement.outerHTML');
  }

  async function url() {
    return evaluate('location.href');
  }

  async function setInputFiles(selector, filePath) {
    const doc = await cdp.send('DOM.getDocument', { depth: 1 });
    const { nodeId } = await cdp.send('DOM.querySelector', {
      nodeId: doc.root.nodeId,
      selector,
    });
    if (!nodeId) throw new Error(`setInputFiles: no ${selector}`);
    await cdp.send('DOM.setFileInputFiles', { nodeId, files: [filePath] });
  }

  return {
    goto,
    load,
    waitFor,
    click,
    clickText,
    fill,
    screenshot,
    html,
    url,
    setInputFiles,
    evaluate,
  };
}
