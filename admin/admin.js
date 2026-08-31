// Редактор страницы.
//
// Предпросмотр собирается теми же модулями, что и живой сайт (assemble.mjs →
// blocks.mjs), поэтому он не «примерно похож», а буквально та же страница.
// Формы строятся по build/schema.mjs, а не пишутся под каждый блок руками:
// иначе новый тип блока пришлось бы заводить в трёх местах.
//
// Чего пока нет: сохранения на сайт и загрузки картинок — для этого нужен
// сервер со входом по почте. Всё остальное работает: правка, порядок,
// скрытие, удаление, добавление и предпросмотр.

import { assemble } from '../build/assemble.mjs';
import { SCHEMA, BACKGROUNDS, SIMPLE, SITE_PARTS, addableTypes, getAt, setAt } from '../build/schema.mjs';
import * as api from './api.js';

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const DRAFT_KEY = 'kunaev.draft.v1';

let site = null;       // текущий контент
let original = null;   // как на сайте, для кнопки «вернуть»
let head = '', tail = '';
let assets = [];
let selectedId = null;   // id блока либо 'part:header' / 'part:nav' / 'part:footer'
let dirty = false;
let account = null;   // почта вошедшего, либо null

// ---------------------------------------------------------------- загрузка
async function boot() {
  // Сначала вход, потом интерфейс. Раньше редактор показывался всем, кто знает
  // адрес: испортить он ничего не мог (публикация всё равно требует пароля),
  // но выглядело это так, будто внутрь пустили постороннего.
  //
  // Это не замок, а ширма: страница редактора лежит на статическом хостинге,
  // и её разметку при желании достанут и без входа. Настоящая защита —
  // по-прежнему пароль на публикации. Ширма просто убирает случайного зрителя.
  if (api.configured()) {
    await restoreSession();
    if (!account) {
      $('#loading').textContent = 'Редактор сайта. Нужен вход.';
      await askLogin({ required: true });
    }
    $('#loading').textContent = 'Загружаю страницу…';
  }

  const bust = `?_=${Date.now()}`;   // черновик не должен спорить с кэшем
  const [siteText, headText, tailText, assetsText] = await Promise.all([
    fetch('../content/site.json' + bust).then((r) => r.text()),
    fetch('../build/partials/doc-head.html' + bust).then((r) => r.text()),
    fetch('../build/partials/doc-tail.html' + bust).then((r) => r.text()),
    fetch('../content/assets.json' + bust).then((r) => r.text()).catch(() => '[]'),
  ]);

  original = JSON.parse(siteText);
  head = headText;
  tail = tailText;
  assets = JSON.parse(assetsText);

  const saved = localStorage.getItem(DRAFT_KEY);
  site = saved ? JSON.parse(saved) : structuredClone(original);
  dirty = Boolean(saved);

  $('#loading').hidden = true;
  $('#app').hidden = false;
  $('#bar-actions').hidden = false;
  fillAddMenu();
  renderAll();
  await restoreSession();
}

// Токен мог протухнуть, пока вкладка была закрыта. Проверяем молча: если он
// уже не годится, человек просто увидит кнопку «Войти», а не ошибку.
async function restoreSession() {
  if (!api.configured() || !api.getToken()) return renderAccount();
  try {
    account = (await api.me()).email;
  } catch {
    account = null;
  }
  renderAccount();
}

function renderAccount() {
  const who = $('#who');
  if (!api.configured()) {
    who.hidden = false;
    who.textContent = 'сервер не подключён';
  } else if (account) {
    who.hidden = false;
    who.textContent = account;
  } else {
    who.hidden = false;
    who.textContent = 'вы не вошли';
  }
}

// ------------------------------------------------------------- список блоков
function blockName(b) {
  const def = SCHEMA[b.type];
  const d = b.data || {};
  const own = d.title || d.eyebrow || d.text || (d.words && d.words[0]);
  return own ? String(own).slice(0, 42) : def?.label || b.type;
}

function renderParts() {
  const list = $('#parts');
  list.replaceChildren();
  Object.entries(SITE_PARTS).forEach(([key, def]) => {
    const id = 'part:' + key;
    const li = el('li', 'block' + (id === selectedId ? ' is-active' : ''));
    const body = el('div', 'block__body');
    body.append(el('span', 'block__name', def.label));
    body.append(el('span', 'block__type', key === 'nav' ? 'шапка, гамбургер и подвал' : 'сквозная часть'));
    li.append(body);
    li.onclick = () => { selectedId = id; renderList(); renderParts(); renderForm(); };
    list.append(li);
  });
}

function renderList() {
  const list = $('#blocks');
  list.replaceChildren();

  site.blocks.forEach((b, i) => {
    const li = el('li', 'block' + (b.id === selectedId ? ' is-active' : '') + (b.visible === false ? ' is-hidden' : ''));
    li.draggable = true;
    li.dataset.index = String(i);

    li.append(el('span', 'block__grip', '⠿'));

    const body = el('div', 'block__body');
    body.append(el('span', 'block__name', blockName(b)));
    body.append(el('span', 'block__type', SCHEMA[b.type]?.label || b.type));
    li.append(body);

    const eye = el('button', 'block__btn', b.visible === false ? '🙈' : '👁');
    eye.type = 'button';
    eye.title = b.visible === false ? 'Показать блок' : 'Скрыть блок';
    eye.onclick = (e) => {
      e.stopPropagation();
      b.visible = b.visible === false;
      touched();
    };
    li.append(eye);

    // Удалять можно только добавленные блоки. Семь блоков страницы заданы
    // дизайном: их прячут, а не выбрасывают, иначе вернуть их будет неоткуда.
    if (!SCHEMA[b.type]?.unique) {
      const del = el('button', 'block__btn block__btn--danger', '🗑');
      del.type = 'button';
      del.title = 'Удалить блок';
      del.onclick = (e) => {
        e.stopPropagation();
        if (!confirm(`Удалить блок «${blockName(b)}»? Это действие нельзя отменить.`)) return;
        site.blocks.splice(i, 1);
        if (selectedId === b.id) selectedId = null;
        touched();
      };
      li.append(del);
    }

    li.onclick = () => { selectedId = b.id; renderList(); renderForm(); scrollPreviewTo(b.id); };
    wireDrag(li);
    list.append(li);
  });
}

// перетаскивание: порядок блоков — главное, ради чего это всё
let dragFrom = null;
function wireDrag(li) {
  li.addEventListener('dragstart', (e) => {
    dragFrom = Number(li.dataset.index);
    li.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  li.addEventListener('dragend', () => {
    li.classList.remove('is-dragging');
    document.querySelectorAll('.block').forEach((n) => n.classList.remove('is-over'));
  });
  li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('is-over'); });
  li.addEventListener('dragleave', () => li.classList.remove('is-over'));
  li.addEventListener('drop', (e) => {
    e.preventDefault();
    const to = Number(li.dataset.index);
    if (dragFrom == null || dragFrom === to) return;
    const [moved] = site.blocks.splice(dragFrom, 1);
    site.blocks.splice(to, 0, moved);
    dragFrom = null;
    touched();
  });
}

// ------------------------------------------------------------------- формы
function renderForm() {
  const box = $('#form');
  const empty = $('#form-empty');

  if (String(selectedId).startsWith('part:')) return renderPartForm(box, empty);

  const b = site.blocks.find((x) => x.id === selectedId);
  if (!b) { box.hidden = true; empty.hidden = false; return; }
  empty.hidden = true;
  box.hidden = false;
  box.replaceChildren();

  const def = SCHEMA[b.type] || { label: b.type, fields: [] };

  const head = el('div', 'form__head');
  head.append(el('h2', 'form__title', blockName(b)));
  head.append(el('span', 'form__type', def.label));
  box.append(head);

  // фон — общий для всех блоков: от него зависят рваные края
  box.append(selectField('Фон блока', BACKGROUNDS, b.bg || 'surface', (v) => { b.bg = v; touched(); },
    'От фона зависит, где страница «рвётся» между блоками. Края считаются сами.'));

  (def.fields || []).forEach((f) => box.append(fieldFor(f, b.data ??= {})));
}

function renderPartForm(box, empty) {
  const key = selectedId.slice('part:'.length);
  const def = SITE_PARTS[key];
  empty.hidden = true;
  box.hidden = false;
  box.replaceChildren();

  const head = el('div', 'form__head');
  head.append(el('h2', 'form__title', def.label));
  head.append(el('span', 'form__type', 'сквозная часть'));
  box.append(head);
  if (def.hint) box.append(el('p', 'field__hint', def.hint));

  // Меню — это массив, а не объект с полями, поэтому оно правится как
  // список; остальные части — обычный набор полей.
  if (def.asList) {
    const holder = { [def.at]: (site[def.at] ??= []) };
    box.append(listField({ ...def.asList, key: def.at }, holder, holder[def.at]));
  } else {
    const data = (site[def.at] ??= {});
    def.fields.forEach((f) => box.append(fieldFor(f, data)));
  }
}

function labelled(labelText, control, hint) {
  const wrap = el('div', 'field');
  const lab = el('label', 'field__label', labelText);
  const id = 'f' + Math.random().toString(36).slice(2, 9);
  control.id = id;
  lab.htmlFor = id;
  wrap.append(lab, control);
  if (hint) wrap.append(el('p', 'field__hint', hint));
  return wrap;
}

function selectField(label, options, value, onChange, hint) {
  const s = el('select');
  options.forEach((o) => {
    const opt = el('option', null, o.label);
    opt.value = o.value;
    if (o.value === value) opt.selected = true;
    s.append(opt);
  });
  s.onchange = () => onChange(s.value);
  return labelled(label, s, hint);
}

function fieldFor(f, data) {
  const value = getAt(data, f.key);

  if (f.type === 'select') {
    return selectField(f.label, f.options, value ?? f.options[0].value,
      (v) => { setAt(data, f.key, v); touched(); }, f.hint);
  }

  if (f.type === 'textarea') {
    const t = el('textarea');
    t.value = value ?? '';
    t.oninput = () => { setAt(data, f.key, t.value); touched({ keepFocus: true }); };
    return labelled(f.label, t, f.hint);
  }

  // список коротких строк: по одной на строку ввода
  if (f.type === 'lines') {
    const t = el('textarea');
    t.value = (value || []).join('\n');
    t.oninput = () => {
      setAt(data, f.key, t.value.split('\n').map((s) => s.trim()).filter(Boolean));
      touched({ keepFocus: true });
    };
    return labelled(f.label, t, f.hint || 'По одному пункту на строку.');
  }

  if (f.type === 'target') return targetField(f, data, value);

  if (f.type === 'image') return imageField(f, data, value);

  if (f.type === 'list') return listField(f, data, value);

  const i = el('input');
  i.type = 'text';
  i.value = value ?? '';
  i.oninput = () => { setAt(data, f.key, i.value); touched({ keepFocus: true }); };
  return labelled(f.label, i, f.hint);
}

/** «Куда ведёт»: список блоков этой страницы плюс «своя ссылка».
 *  Раньше здесь было обычное поле ввода, и чтобы завести пункт меню, нужно
 *  было знать, что писать «#about» — а откуда взялось это слово, не видно
 *  нигде. Теперь якорь выбирается из блоков, которые есть на странице. */
function blockTitle(b) {
  const label = SCHEMA[b.type]?.label || b.type;
  const own = String(b.data?.title || b.data?.titleTop || b.data?.label || '').trim().slice(0, 40);
  // «Принципы работы: Принципы работы» — заголовок блока часто совпадает с
  // названием типа, и повторять его дважды ни к чему
  if (!own || own.toLowerCase() === label.toLowerCase()) return label;
  return `${label}: ${own}`;
}

function targetField(f, data, value) {
  const v = String(value ?? '');
  const targets = (site?.blocks || []).map((b) => ({ value: '#' + (b.anchor || b.id), label: blockTitle(b) }));
  const known = targets.some((t) => t.value === v);
  const OWN = 'свой';

  const wrap = el('div');
  const box = el('div');

  const draw = (mode) => {
    box.textContent = '';
    if (mode === OWN) {
      const i = el('input');
      i.type = 'text';
      i.value = known ? '' : v;
      i.placeholder = 'https://t.me/… или tel:+7…';
      i.oninput = () => { setAt(data, f.key, i.value); touched({ keepFocus: true }); };
      box.append(labelled(f.label, i, 'Полная ссылка: сайт, мессенджер или телефон.'));
    } else {
      box.append(selectField(f.label, targets, known ? v : targets[0]?.value,
        (x) => { setAt(data, f.key, x); touched(); },
        'Нажатие прокрутит страницу к этому блоку.'));
    }
  };

  const startMode = known || v === '' ? 'block' : OWN;

  const mode = el('div', 'field');
  const sel = el('select');
  [{ value: 'block', label: 'Блок на этой странице' }, { value: OWN, label: 'Своя ссылка' }]
    .forEach((o) => {
      const opt = el('option', null, o.label);
      opt.value = o.value;
      if (o.value === startMode) opt.selected = true;
      sel.append(opt);
    });
  // Переключатель НЕ вызывает touched: это выбор способа ввода, а не правка
  // контента. Перерисовка формы здесь возвращала поле обратно в режим
  // «блок» — по пустому значению режим было не отличить от нового пункта.
  sel.onchange = () => {
    setAt(data, f.key, sel.value === OWN ? '' : (targets[0]?.value || ''));
    draw(sel.value);
  };
  mode.append(el('label', 'field__label', 'Тип ссылки'), sel);

  draw(startMode);
  wrap.append(mode, box);
  return wrap;
}

function imageField(f, data, value) {
  const wrap = el('div', 'field');
  wrap.append(el('label', 'field__label', f.label));

  const row = el('div', 'image');
  const img = el('img', 'image__thumb');
  img.alt = '';
  const full = (v) => (v && !v.startsWith('assets/') && f.dir ? f.dir + v : v);
  // без src, а не с пустым: пустой src браузер считает ссылкой на саму
  // страницу и честно её запрашивает
  if (full(value)) img.src = '../' + full(value);

  const side = el('div', 'image__side');
  const pick = el('button', 'btn btn--ghost btn--small', 'Выбрать картинку');
  pick.type = 'button';
  const path = el('p', 'image__path', value || 'не выбрана');
  pick.onclick = () => openPicker(f, (chosen) => {
    // в списке документов хранится только имя файла, в остальных полях — путь
    const stored = f.dir && chosen.startsWith(f.dir) ? chosen.slice(f.dir.length) : chosen;
    setAt(data, f.key, stored);
    img.src = '../' + chosen;
    path.textContent = stored;
    touched();
  });
  side.append(pick, path);

  row.append(img, side);
  wrap.append(row);
  if (f.hint) wrap.append(el('p', 'field__hint', f.hint));
  return wrap;
}

function listField(f, data, value) {
  const items = Array.isArray(value) ? value : [];
  const wrap = el('div', 'field');
  wrap.append(el('label', 'field__label', f.label));

  const box = el('div', 'list');
  items.forEach((item, idx) => {
    const card = el('div', 'item');
    const head = el('div', 'item__head');
    head.append(el('span', 'item__name', `${f.itemLabel || 'Элемент'} ${idx + 1}`));

    const tools = el('div', 'item__tools');
    const mk = (glyph, title, fn, cls) => {
      const b = el('button', 'block__btn' + (cls || ''), glyph);
      b.type = 'button'; b.title = title; b.onclick = fn;
      return b;
    };
    if (idx > 0) tools.append(mk('↑', 'Выше', () => {
      items.splice(idx - 1, 0, items.splice(idx, 1)[0]); touched();
    }));
    if (idx < items.length - 1) tools.append(mk('↓', 'Ниже', () => {
      items.splice(idx + 1, 0, items.splice(idx, 1)[0]); touched();
    }));
    tools.append(mk('🗑', 'Удалить', () => {
      if (!confirm('Удалить этот элемент?')) return;
      items.splice(idx, 1); touched();
    }, ' block__btn--danger'));
    head.append(tools);
    card.append(head);

    f.of.forEach((sub) => card.append(fieldFor(sub, item)));
    box.append(card);
  });
  wrap.append(box);

  if (!f.max || items.length < f.max) {
    const add = el('button', 'btn btn--ghost btn--small list__add', `Добавить: ${(f.itemLabel || 'элемент').toLowerCase()}`);
    add.type = 'button';
    add.onclick = () => {
      const blank = {};
      f.of.forEach((sub) => setAt(blank, sub.key, sub.type === 'lines' ? [] : ''));
      items.push(blank);
      setAt(data, f.key, items);
      touched();
    };
    wrap.append(add);
  }
  return wrap;
}

// ------------------------------------------------------------- предпросмотр
let previewTimer = null;
function renderPreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    // base нужен, чтобы ссылки на стили и картинки внутри предпросмотра
    // считались от корня сайта, а не от папки /admin/. Адрес обязательно
    // абсолютный: относительный <base> внутри srcdoc браузер разрешает
    // от about:srcdoc, и картинки со стилями отваливаются.
    const html = assemble(structuredClone(site), head, tail, {
      base: new URL('..', location.href).href,
    });
    $('#preview').srcdoc = html;
  }, 180);
}

function scrollPreviewTo(id) {
  const frame = $('#preview');
  const run = () => {
    const node = frame.contentDocument?.querySelector(`[data-block="${CSS.escape(id)}"]`);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (frame.contentDocument?.readyState === 'complete') run();
  else frame.addEventListener('load', run, { once: true });
}

function setPreviewWidth(w) {
  const frame = $('#preview');
  const stage = $('#sizer').parentElement;
  const availW = stage.clientWidth - 32;
  const availH = stage.clientHeight - 32;
  const scale = Math.min(1, availW / w);

  // Страница внутри живёт в своей настоящей ширине, а уменьшает её zoom.
  // transform: scale() здесь не годится — с ним содержимое рамки перестаёт
  // отрисовываться. Побочная польза: zoom учитывается в разметке, поэтому
  // рамка сама занимает уже уменьшенное место.
  frame.style.width = w + 'px';
  frame.style.height = availH / scale + 'px';
  frame.style.zoom = scale;
}

// ------------------------------------------------------------------- прочее
function renderAll({ keepFocus = false } = {}) {
  if (!keepFocus) renderForm();
  renderParts();
  renderList();
  renderPreview();
  $('#dirty').hidden = !dirty;
}

function touched(opts = {}) {
  dirty = true;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(site));
  renderAll(opts);
}

function fillAddMenu() {
  const s = $('#add-type');
  addableTypes.forEach((t) => {
    const o = el('option', null, SIMPLE[t].label);
    o.value = t;
    s.append(o);
  });
}

function openPicker(f, onPick) {
  const dlg = $('#picker');
  const grid = $('#picker-grid');
  const note = $('#picker-note');
  const upload = $('#picker-upload');
  const status = $('#picker-status');
  const file = $('#picker-file');

  function fill() {
    grid.replaceChildren();
    // для документов показываем только их папку — иначе легко подставить портрет
    const list = f.dir ? assets.filter((a) => a.startsWith(f.dir)) : assets;
    list.forEach((a) => {
      const item = el('button', 'picker__item');
      item.type = 'button';
      const img = el('img');
      img.src = '../' + a;
      img.alt = '';
      item.append(img, el('span', null, a.replace('assets/', '')));
      item.onclick = () => { onPick(a); dlg.close(); };
      grid.append(item);
    });
  }
  fill();

  upload.hidden = !api.configured();
  status.textContent = '';
  note.textContent = api.configured()
    ? 'Большие фотографии перед отправкой уменьшаются сами — до 1600px по длинной стороне.'
    : 'Сервер админки не подключён, поэтому загрузка недоступна. Выберите из уже загруженных.';

  file.value = '';
  file.onchange = async () => {
    const chosen = file.files[0];
    if (!chosen) return;
    if (!account && !(await askLogin({}))) return;

    status.textContent = 'Уменьшаю…';
    try {
      const { blob } = await api.shrink(chosen);
      status.textContent = `Отправляю (${Math.round(blob.size / 1024)} КБ)…`;
      const r = await api.upload(blob, chosen.name);
      // добавляем в опись сразу: assets.json пересоберётся только к следующей
      // сборке сайта, а картинка нужна прямо сейчас
      if (!assets.includes(r.path)) assets.push(r.path);
      status.textContent = '';
      onPick(r.path);
      dlg.close();
    } catch (ex) {
      status.textContent = ex.message;
    }
  };

  dlg.showModal();
}

// ------------------------------------------------------------------ кнопки
$('#add').onclick = () => {
  const type = $('#add-type').value;
  const def = SIMPLE[type];
  const id = `${type}-${Date.now().toString(36)}`;
  const block = { id, type, visible: true, bg: 'surface', data: structuredClone(def.defaults) };
  // новый блок встаёт после выбранного — так понятнее, чем всегда в конец
  const at = site.blocks.findIndex((b) => b.id === selectedId);
  site.blocks.splice(at >= 0 ? at + 1 : site.blocks.length, 0, block);
  selectedId = id;
  touched();
};

$('#reset').onclick = () => {
  if (!confirm('Вернуть страницу к тому, что сейчас на сайте? Все правки в редакторе пропадут.')) return;
  site = structuredClone(original);
  localStorage.removeItem(DRAFT_KEY);
  dirty = false;
  selectedId = null;
  renderAll();
};

$('#download').onclick = () => {
  const blob = new Blob([JSON.stringify(site, null, 2) + '\n'], { type: 'application/json' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'site.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

// ---------------------------------------------------------------- вход
/** @param required  вход при запуске: отменить его нельзя — отменять некуда,
 *                    за окном пусто. При публикации, наоборот, отмена нужна. */
function askLogin({ required = false } = {}) {
  return new Promise((resolve) => {
    const dlg = $('#login');
    const form = $('#login-form');
    const err = $('#login-error');
    const submit = $('#login-submit');
    err.hidden = true;
    $('#login-cancel').hidden = required;
    // Esc закрывает диалог мимо кнопок — при обязательном входе не даём
    dlg.oncancel = (e) => { if (required) e.preventDefault(); };

    form.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Проверяю…';
      try {
        account = await api.login($('#login-email').value, $('#login-password').value);
        renderAccount();
        dlg.close();
        resolve(true);
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
      } finally {
        submit.disabled = false;
        submit.textContent = 'Войти';
      }
    };
    $('#login-cancel').onclick = () => { if (!required) { dlg.close(); resolve(false); } };
    dlg.showModal();
  });
}

$('#publish').onclick = async () => {
  if (!api.configured()) {
    alert(
      'Сервер админки ещё не подключён.\n\n' +
      'Правки хранятся в этом браузере и никуда не денутся. Чтобы передать их ' +
      'разработчику, нажмите «Скачать файл».'
    );
    return;
  }
  if (!account && !(await askLogin({}))) return;

  const btn = $('#publish');
  btn.disabled = true;
  btn.textContent = 'Публикую…';
  try {
    await api.publish(site);
    // Опубликованное становится новой точкой отсчёта: иначе «Вернуть как на
    // сайте» откатывало бы к тому, что было до публикации.
    original = structuredClone(site);
    localStorage.removeItem(DRAFT_KEY);
    dirty = false;
    renderAll();
    alert('Опубликовано. Страница обновится через минуту-другую — сайт пересобирается.');
  } catch (ex) {
    if (ex.auth) {
      account = null;
      renderAccount();
      alert('Вход истёк, войдите заново.');
    } else {
      alert('Не удалось опубликовать: ' + ex.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Опубликовать';
  }
};

$('.preview__widths').onclick = (e) => {
  const btn = e.target.closest('button[data-w]');
  if (!btn) return;
  document.querySelectorAll('.preview__widths button').forEach((b) => b.classList.toggle('is-on', b === btn));
  setPreviewWidth(Number(btn.dataset.w));
};

window.addEventListener('resize', () => {
  const on = document.querySelector('.preview__widths .is-on');
  if (on) setPreviewWidth(Number(on.dataset.w));
});

window.addEventListener('beforeunload', (e) => {
  if (dirty) e.preventDefault();
});

boot().then(() => setPreviewWidth(1440)).catch((err) => {
  $('#loading').textContent = 'Не удалось загрузить страницу: ' + err.message;
});
