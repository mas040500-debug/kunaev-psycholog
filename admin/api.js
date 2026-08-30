// Разговор с сервером админки.
//
// Токен лежит в localStorage и уходит заголовком Authorization, а не в cookie.
// Причина практическая: админка и сервер живут на разных доменах, а браузеры
// всё жёстче режут межсайтовые cookie — вход просто перестал бы работать в
// самый неподходящий момент.

import { API_BASE } from './config.js';

const TOKEN_KEY = 'kunaev.token.v1';

export const configured = () => Boolean(API_BASE);
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function call(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  if (!configured()) throw new Error('Сервер админки не подключён.');

  const headers = {};
  if (auth) headers.authorization = `Bearer ${getToken()}`;
  if (body && !raw) headers['content-type'] = 'application/json';

  let res;
  try {
    res = await fetch(API_BASE.replace(/\/$/, '') + path, {
      method, headers, body: raw ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Сеть отвалилась или адрес неверный — это не «ошибка сервера»,
    // и человеку надо сказать другое.
    throw new Error('Сервер не отвечает. Проверьте связь и попробуйте ещё раз.');
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { setToken(''); throw Object.assign(new Error(data.error || 'Нужно войти.'), { auth: true }); }
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}.`);
  return data;
}

export const login = async (email, password) => {
  const r = await call('/login', { method: 'POST', body: { email, password }, auth: false });
  setToken(r.token);
  return r.email;
};

export const me = () => call('/me');
export const publish = (site) => call('/publish', { method: 'POST', body: site });

export const upload = (blob, name) => {
  const fd = new FormData();
  fd.append('file', blob, name);
  fd.append('name', name);
  return call('/upload', { method: 'POST', body: fd, raw: true });
};

/**
 * Ужимает картинку прямо в браузере, до отправки.
 * Без этого фотография с телефона на 6 МБ уехала бы в репозиторий как есть, и
 * через полгода он весил бы гигабайты, а страница грузилась бы минуту.
 * Тип сохраняется: у PNG бывает прозрачность, и перегон в JPEG залил бы её чёрным.
 */
export async function shrink(file, maxSide = 1600) {
  const type = ['image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size < 900 * 1024) return { blob: file, type };

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((res) => canvas.toBlob(res, type, 0.85));
  return { blob, type };
}
