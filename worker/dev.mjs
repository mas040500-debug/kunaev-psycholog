// Запуск воркера локально, чтобы проверить админку целиком до выкладки.
// Тот же обработчик, что уйдёт в Cloudflare; GitHub подменён на память.
//
//   node worker/dev.mjs      → http://localhost:8787
//
// Пароль: почта admin@local, пароль «локальный-пароль-1234».

import { createServer } from 'node:http';
import worker, { _internal } from './src/index.js';

const SALT = 'bG9jYWxsb2NhbGxvY2FsMTI=';
const env = {
  REPO: 'owner/repo', BRANCH: 'main',
  GITHUB_TOKEN: 'локальный-фальшивый-токен',
  SESSION_SECRET: 'локальная-подпись',
  ALLOWED_ORIGINS: 'http://localhost:8765',
  AUTH_USERS: JSON.stringify([{ email: 'admin@local', salt: SALT, hash: await _internal.pbkdf2('локальный-пароль-1234', SALT) }]),
};

const store = new Map();
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (!u.startsWith('https://api.github.com/')) return realFetch(url, init);
  const path = decodeURIComponent(u.split('/contents/')[1] || '').split('?')[0];
  if (init.method === 'PUT') {
    const body = JSON.parse(init.body);
    store.set(path, body.content);
    console.log(`  → записано ${path} (${body.content.length} символов base64)`);
    return new Response(JSON.stringify({ commit: { sha: 'локальный' } }), { status: 200 });
  }
  if (!store.has(path)) return new Response('нет файла', { status: 404 });
  return new Response(JSON.stringify({ sha: 'sha-' + path }), { status: 200 });
};

createServer(async (req, res) => {
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined
    : await new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
  const out = await worker.fetch(new Request('http://localhost:8787' + req.url,
    { method: req.method, headers: req.headers, body, duplex: 'half' }), env);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(8787, () => console.log('Локальный сервер админки: http://localhost:8787'));
