// Сервер админки. Делает ровно три вещи: пускает по паролю, кладёт контент в
// репозиторий и принимает картинки. Больше ему ничего не нужно — сайт статический.
//
// Доступ к репозиторию живёт ТОЛЬКО здесь, в секрете окружения. В браузер он не
// попадает никогда: психолог отправляет сюда правку, а с GitHub разговаривает
// уже сервер. Поэтому у редактора нет ни токенов, ни аккаунта на GitHub.
//
// Почему пароль, а не ссылка на почту. Ссылка требует почтового провайдера,
// проверки домена и живёт ровно настолько, насколько письмо доходит. Для двух
// человек это лишняя точка отказа: пароль, сохранённый в браузере, надёжнее.
// Отправку писем можно добавить позже, не трогая остальное.

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

// ---------------------------------------------------------------- утилиты
const enc = new TextEncoder();

/** Base64 порциями. Наивное String.fromCharCode(...bytes) разворачивает весь
 *  файл в аргументы вызова, и уже на четверти мегабайта кончается стек —
 *  на JSON это незаметно, а первая же картинка роняет запрос. */
function b64(buf) {
  const bytes = new Uint8Array(buf);
  const STEP = 0x8000;
  let out = '';
  for (let i = 0; i < bytes.length; i += STEP) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
  }
  return btoa(out);
}
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (s) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

/** Сравнение за постоянное время: обычное === выдаёт длину общего префикса. */
function equalConstantTime(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, saltB64, iterations = 210000) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: unb64(saltB64), iterations, hash: 'SHA-256' }, key, 256);
  return b64(bits);
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(b64(await crypto.subtle.sign('HMAC', key, enc.encode(message))));
}

/** Токен — подписанная строка «данные.подпись». Хранится у клиента, но
 *  подделать его нельзя: подпись проверяется секретом сервера. */
async function issueToken(env, email, days = 30) {
  const payload = b64url(btoa(JSON.stringify({ email, exp: Date.now() + days * 864e5 })));
  return `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
}

async function readToken(env, token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!equalConstantTime(sig, await hmac(env.SESSION_SECRET, payload))) return null;
  try {
    const data = JSON.parse(unb64url(payload));
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}

// ---------------------------------------------------------------- GitHub
async function gh(env, path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${env.REPO}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'kunaev-admin',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

/** Кладёт файл в репозиторий. sha существующего файла обязателен — без него
 *  GitHub считает это созданием и отказывает, если файл уже есть. */
async function putFile(env, path, contentB64, message) {
  let sha;
  try {
    sha = (await gh(env, `/contents/${path}?ref=${env.BRANCH}`)).sha;
  } catch {
    sha = undefined;   // файла ещё нет — это нормально
  }
  return gh(env, `/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content: contentB64, branch: env.BRANCH, sha }),
  });
}

// ---------------------------------------------------------------- проверки
const MAX_CONTENT = 512 * 1024;        // контент — это текст, полмегабайта с запасом
const MAX_IMAGE = 4 * 1024 * 1024;     // картинка уже ужата в браузере
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Имя файла приходит от пользователя, поэтому собирается заново: любые
 *  «../» и прочая экзотика отсекаются, остаются буквы, цифры и дефис. */
function safeName(name, ext) {
  const base = String(name || 'image')
    .replace(/\.[^.]*$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
  return `${base}-${Date.now().toString(36)}.${ext}`;
}

function looksLikeSite(site) {
  if (!site || typeof site !== 'object') return 'ожидался объект';
  if (!Array.isArray(site.blocks)) return 'нет списка блоков';
  if (!site.blocks.length) return 'список блоков пуст';
  if (site.blocks.some((b) => !b || typeof b.type !== 'string' || typeof b.id !== 'string'))
    return 'у блока нет id или типа';
  return null;
}

// ---------------------------------------------------------------- ответы
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });

function corsHeaders(env, request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  // Отражаем только заранее разрешённый источник. Звёздочка тут не годится:
  // тогда админку можно было бы дёргать с любого чужого сайта.
  return allowed.includes(origin)
    ? { 'access-control-allow-origin': origin,
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-max-age': '86400',
        vary: 'origin' }
    : {};
}

// Простейший тормоз для перебора пароля: счётчик живёт в памяти воркера.
// Он сбрасывается при перезапуске и не общий для всех машин, поэтому это
// не защита, а помеха. Настоящий лимит — на стороне Cloudflare (Rate Limiting).
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.until) { attempts.set(ip, { n: 1, until: now + 15 * 60000 }); return false; }
  rec.n += 1;
  return rec.n > 10;
}

// ---------------------------------------------------------------- маршруты
async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  // Самопроверка настроек. Нужна ровно при первой выкладке: без неё
  // ошибка в одном секрете выглядит как «что-то пошло не так», и её
  // приходится угадывать. Значения секретов не показываются — только
  // «задан / не задан» и разбирается ли содержимое.
  if (path === '/health') {
    const users = (() => {
      if (!env.AUTH_USERS) return 'НЕ ЗАДАН';
      try {
        const list = JSON.parse(env.AUTH_USERS);
        if (!Array.isArray(list)) return 'НЕ СПИСОК — нужен массив в квадратных скобках';
        if (!list.length) return 'СПИСОК ПУСТ';
        const broken = list.findIndex((u) => !u?.email || !u?.salt || !u?.hash);
        if (broken >= 0) return `в записи №${broken + 1} нет email, salt или hash`;
        return `${list.length} шт.: ${list.map((u) => u.email).join(', ')}`;
      } catch (e) {
        return `НЕ РАЗБИРАЕТСЯ как JSON (${e.message}). Частая причина — значение вставлено в несколько строк и обрезалось.`;
      }
    })();

    // Настройки могут быть верными, а вход всё равно падать: отпечаток
    // пароля считается тяжёлой функцией, и она способна упереться в
    // ограничения площадки или в испорченную соль. Поэтому проверка не
    // верит глазам, а честно пробует посчитать — и показывает, что вышло.
    let проверкаОтпечатка = 'не проверялась: список пользователей не разобран';
    try {
      const list = JSON.parse(env.AUTH_USERS || '[]');
      if (list.length) {
        const t0 = Date.now();
        await pbkdf2('проверка', list[0].salt, list[0].iterations || 210000);
        проверкаОтпечатка = `считается, ${Date.now() - t0} мс, повторений ${list[0].iterations || 210000}`;
      }
    } catch (e) {
      проверкаОтпечатка = `НЕ СЧИТАЕТСЯ: ${e.name}: ${e.message}`;
    }

    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

    return json({
      ok: true,
      настройки: {
        REPO: env.REPO || 'НЕ ЗАДАН',
        BRANCH: env.BRANCH || 'НЕ ЗАДАН',
        ALLOWED_ORIGINS: allowed.length ? allowed : 'НЕ ЗАДАН',
        GITHUB_TOKEN: env.GITHUB_TOKEN ? `задан, ${env.GITHUB_TOKEN.length} символов` : 'НЕ ЗАДАН',
        SESSION_SECRET: env.SESSION_SECRET ? `задан, ${env.SESSION_SECRET.length} символов` : 'НЕ ЗАДАН',
        AUTH_USERS: users,
      },
      отпечатокПароля: проверкаОтпечатка,
      этотЗапрос: {
        origin: origin || 'браузер не прислал',
        разрешён: origin ? allowed.includes(origin) : null,
      },
    });
  }

  if (path === '/login' && request.method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    if (tooManyAttempts(ip)) return json({ error: 'Слишком много попыток. Подождите 15 минут.' }, 429);

    const { email, password } = await request.json().catch(() => ({}));
    const users = JSON.parse(env.AUTH_USERS || '[]');
    const user = users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase().trim());
    // Хеш считаем всегда, даже когда пользователя нет: иначе по времени ответа
    // видно, какие адреса заведены.
    const probe = user || { salt: 'AAAAAAAAAAAAAAAAAAAAAA==', hash: '' };
    const got = await pbkdf2(String(password || ''), probe.salt, probe.iterations || 210000);
    if (!user || !equalConstantTime(got, probe.hash)) return json({ error: 'Неверная почта или пароль.' }, 401);

    return json({ token: await issueToken(env, user.email), email: user.email });
  }

  // дальше только для вошедших
  const auth = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const session = await readToken(env, auth);
  if (!session) return json({ error: 'Нужно войти заново.' }, 401);

  if (path === '/me') return json({ email: session.email });

  if (path === '/publish' && request.method === 'POST') {
    const body = await request.text();
    if (body.length > MAX_CONTENT) return json({ error: 'Слишком большой контент.' }, 413);

    let site;
    try { site = JSON.parse(body); } catch { return json({ error: 'Контент не разобрался.' }, 400); }

    // Проверка на входе, а не «доверимся клиенту»: сломанный контент уехал бы
    // в репозиторий и уронил сборку, а чинить это пришлось бы руками.
    const bad = looksLikeSite(site);
    if (bad) return json({ error: `Контент не похож на страницу: ${bad}.` }, 400);

    const text = JSON.stringify(site, null, 2) + '\n';
    const res = await putFile(env, 'content/site.json', b64(enc.encode(text)),
      `Правка контента через админку (${session.email})`);
    return json({ ok: true, commit: res.commit?.sha });
  }

  if (path === '/upload' && request.method === 'POST') {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ error: 'Файл не пришёл.' }, 400);
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return json({ error: 'Годятся JPEG, PNG и WebP.' }, 415);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length > MAX_IMAGE) return json({ error: 'Картинка тяжелее 4 МБ.' }, 413);

    const name = safeName(form.get('name') || file.name, ext);
    const path2 = `assets/uploads/${name}`;
    await putFile(env, path2, b64(bytes), `Картинка из админки: ${name} (${session.email})`);
    return json({ ok: true, path: path2 });
  }

  return json({ error: 'Не найдено.' }, 404);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request);
    let res;
    try {
      res = await handle(request, env);
    } catch (err) {
      // Наружу — общая фраза: в тексте ошибки GitHub может быть лишнее.
      console.error(err);
      res = json({ error: 'На сервере что-то пошло не так.' }, 500);
    }
    const headers = new Headers(res.headers);
    Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  },
};

// вынесено для тестов
export const _internal = { safeName, looksLikeSite, issueToken, readToken, pbkdf2, equalConstantTime };
