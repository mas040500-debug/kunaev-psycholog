// Проверка сервера админки без Cloudflare и без настоящего GitHub.
//
// Воркер — обычный обработчик fetch на стандартных веб-интерфейсах, поэтому
// он запускается прямо в Node: подменяем глобальный fetch на заглушку GitHub
// и дёргаем те же маршруты, что будут в бою. Это ловит логику входа, проверки
// и имена файлов — то есть всё, кроме самой доставки в GitHub.
//
// Запуск: node worker/test.mjs

import worker, { _internal } from './src/index.js';

let passed = 0, failed = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${extra ? ' — ' + extra : ''}`); }
};

// --- окружение -------------------------------------------------------------
const SALT = 'c2FsdHNhbHRzYWx0c2FsdA==';
const PASSWORD = 'верный-пароль-42';
const hash = await _internal.pbkdf2(PASSWORD, SALT);

const env = {
  REPO: 'owner/repo',
  BRANCH: 'main',
  GITHUB_TOKEN: 'секрет-который-не-должен-утечь',
  SESSION_SECRET: 'подпись-сессий',
  ALLOWED_ORIGINS: 'https://mas040500-debug.github.io',
  AUTH_USERS: JSON.stringify([{ email: 'psy@example.com', salt: SALT, hash }]),
};

// --- поддельный GitHub -----------------------------------------------------
const committed = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (!u.startsWith('https://api.github.com/repos/owner/repo')) throw new Error('чужой адрес: ' + u);
  if (!/^Bearer /.test(init.headers?.authorization || '')) throw new Error('нет авторизации');
  if (init.method === 'PUT') {
    committed.push({ path: u.split('/contents/')[1], body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ commit: { sha: 'deadbeef' } }), { status: 200 });
  }
  return new Response(JSON.stringify({ sha: 'старый-sha' }), { status: 200 });
};

const call = (path, init = {}) =>
  worker.fetch(new Request('https://api.example.com' + path, {
    headers: { origin: 'https://mas040500-debug.github.io', ...init.headers }, ...init,
  }), env);

const SITE = { blocks: [{ id: 'hero', type: 'hero', data: {} }] };

// --- вход ------------------------------------------------------------------
console.log('\nВход');
{
  const r = await call('/login', { method: 'POST', body: JSON.stringify({ email: 'psy@example.com', password: PASSWORD }) });
  const b = await r.json();
  ok('верный пароль пускает', r.status === 200 && typeof b.token === 'string');
  globalThis.TOKEN = b.token;

  const bad = await call('/login', { method: 'POST', body: JSON.stringify({ email: 'psy@example.com', password: 'не тот' }) });
  ok('неверный пароль не пускает', bad.status === 401);

  const nobody = await call('/login', { method: 'POST', body: JSON.stringify({ email: 'чужой@example.com', password: PASSWORD }) });
  const nb = await nobody.json();
  ok('незнакомая почта не пускает', nobody.status === 401);
  ok('ответ не выдаёт, заведена ли почта', nb.error === (await bad.json()).error);
}

// --- защита маршрутов ------------------------------------------------------
console.log('\nДоступ');
{
  const r = await call('/publish', { method: 'POST', body: JSON.stringify(SITE) });
  ok('без токена публиковать нельзя', r.status === 401);

  const forged = await call('/me', { headers: { authorization: 'Bearer cG9kZGVsa2E.c2lnbg' } });
  ok('подделанный токен не проходит', forged.status === 401);

  const [payload] = TOKEN.split('.');
  const wrongSig = await call('/me', { headers: { authorization: `Bearer ${payload}.AAAA` } });
  ok('токен с чужой подписью не проходит', wrongSig.status === 401);

  const good = await call('/me', { headers: { authorization: `Bearer ${TOKEN}` } });
  ok('свой токен проходит', good.status === 200 && (await good.json()).email === 'psy@example.com');

  const expired = await _internal.issueToken(env, 'psy@example.com', -1);
  const old = await call('/me', { headers: { authorization: `Bearer ${expired}` } });
  ok('просроченный токен не проходит', old.status === 401);
}

// --- публикация ------------------------------------------------------------
console.log('\nПубликация');
{
  const auth = { authorization: `Bearer ${TOKEN}` };
  committed.length = 0;

  const r = await call('/publish', { method: 'POST', headers: auth, body: JSON.stringify(SITE) });
  ok('контент уходит в репозиторий', r.status === 200 && committed.length === 1);
  ok('кладётся в content/site.json', committed[0]?.path === 'content/site.json');
  ok('на нужной ветке', committed[0]?.body.branch === 'main');
  ok('с sha существующего файла', committed[0]?.body.sha === 'старый-sha');
  const saved = JSON.parse(atob(committed[0].body.content));
  ok('содержимое доехало целиком', JSON.stringify(saved) === JSON.stringify(SITE));

  const broken = await call('/publish', { method: 'POST', headers: auth, body: '{не json' });
  ok('нечитаемый контент отклоняется', broken.status === 400);

  const empty = await call('/publish', { method: 'POST', headers: auth, body: JSON.stringify({ blocks: [] }) });
  ok('пустая страница отклоняется', empty.status === 400);

  const noType = await call('/publish', { method: 'POST', headers: auth, body: JSON.stringify({ blocks: [{ id: 'x' }] }) });
  ok('блок без типа отклоняется', noType.status === 400);

  const huge = await call('/publish', { method: 'POST', headers: auth, body: 'x'.repeat(600 * 1024) });
  ok('слишком большой контент отклоняется', huge.status === 413);
}

// --- картинки --------------------------------------------------------------
console.log('\nКартинки');
{
  const auth = { authorization: `Bearer ${TOKEN}` };
  committed.length = 0;

  const png = new File([new Uint8Array([137, 80, 78, 71])], 'Моё Фото!!.PNG', { type: 'image/png' });
  const fd = new FormData();
  fd.append('file', png);
  const r = await call('/upload', { method: 'POST', headers: auth, body: fd });
  const b = await r.json();
  ok('картинка принимается', r.status === 200 && b.path.startsWith('assets/uploads/'));
  ok('имя обеззаражено', /^assets\/uploads\/[a-z0-9а-яё-]+-[a-z0-9]+\.png$/i.test(b.path), b.path);

  const evil = new FormData();
  evil.append('file', png);
  evil.append('name', '../../../etc/passwd');
  const r2 = await call('/upload', { method: 'POST', headers: auth, body: evil });
  const b2 = await r2.json();
  ok('путь наружу не пролезает', !b2.path.includes('..') && b2.path.startsWith('assets/uploads/'), b2.path);

  // Ровно на этом размере наивный base64 ронял запрос переполнением стека.
  const bigFd = new FormData();
  bigFd.append('file', new File([new Uint8Array(600 * 1024)], 'big.jpg', { type: 'image/jpeg' }));
  const rBig = await call('/upload', { method: 'POST', headers: auth, body: bigFd });
  ok('картинка в сотни килобайт не роняет сервер', rBig.status === 200, String(rBig.status));

  const pdf = new FormData();
  pdf.append('file', new File([new Uint8Array([1])], 'x.pdf', { type: 'application/pdf' }));
  const r3 = await call('/upload', { method: 'POST', headers: auth, body: pdf });
  ok('не-картинка отклоняется', r3.status === 415);
}

// --- источники -------------------------------------------------------------
console.log('\nИсточники запросов');
{
  const mine = await call('/health');
  ok('свой источник разрешён', mine.headers.get('access-control-allow-origin') === 'https://mas040500-debug.github.io');

  const alien = await worker.fetch(new Request('https://api.example.com/health',
    { headers: { origin: 'https://evil.example' } }), env);
  ok('чужой источник не разрешён', alien.headers.get('access-control-allow-origin') === null);
}

// --- секреты ---------------------------------------------------------------
console.log('\nСекреты');
{
  const auth = { authorization: `Bearer ${TOKEN}` };
  globalThis.fetch = async () => { throw new Error('GitHub 401: Bad credentials for секрет-который-не-должен-утечь'); };
  const r = await call('/publish', { method: 'POST', headers: auth, body: JSON.stringify(SITE) });
  const text = await r.text();
  ok('ошибка сервера не раскрывает токен', r.status === 500 && !text.includes('секрет-который-не-должен-утечь'), text);
}

console.log(`\nПройдено ${passed}, провалено ${failed}\n`);
process.exit(failed ? 1 : 0);
