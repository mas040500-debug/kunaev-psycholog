// Сборка страницы из контента. Ни одного обращения к файловой системе:
// этот модуль одинаково работает и в Node (сборка сайта), и в браузере
// (предпросмотр в админке). Именно поэтому предпросмотр не может разойтись
// с тем, что окажется на сайте, — шаблоны буквально одни и те же.

import { renderBlock, renderHeader, renderFooter } from './blocks.mjs';

// Рваные края считаются по фактическому порядку блоков, а не задаются руками.
// Иначе стоит спрятать блок — и у соседа остаётся край чужого цвета: сиреневый
// на белом фоне. Правило: край нужен там, где у соседей разный фон, и рисует
// его НИЖНИЙ блок краем сверху, залитым цветом верхнего. Флаг tearInto: "next"
// переключает на зеркальный вариант — блок рвётся вниз сам.
export function assignTorn(blocks) {
  blocks.forEach((b, i) => {
    const prev = blocks[i - 1];
    const next = blocks[i + 1];
    b.torn = {
      top: prev && prev.bg !== b.bg && prev.tearInto !== 'next' ? prev.bg : null,
      bottom: next && next.bg !== b.bg && b.tearInto === 'next' ? next.bg : null,
    };
  });
  return blocks;
}

export function visibleBlocks(site) {
  return assignTorn(site.blocks.filter((b) => b.visible !== false));
}

// Карусель дипломов берёт список из контента, а не из зашитого в скрипт
// массива: иначе у сканов было бы два источника правды.
function docsScript(blocks) {
  const edu = blocks.find((b) => b.type === 'education');
  const docs = (edu && edu.data.docs) || [];
  // собираем построчно, а не правкой JSON регулярками: в подписях бывают
  // кавычки и запятые, и любая такая правка рано или поздно их зацепит
  return docs
    .map((d) => {
      const f = (k) => `${k}: ${JSON.stringify(d[k] ?? '')}`;
      return `      { ${f('src')}, ${f('note')}, ${f('sub')},\n        ${f('alt')} }`;
    })
    .join(',\n');
}

// Адрес сайта — единственное место, где он записан. Из него собираются
// канонический адрес, карточка ссылки, robots.txt и карта сайта: при переезде
// на свой домен меняется одно поле в админке, а не пять файлов.
export const siteUrl = (m = {}) => String(m.siteUrl || '').trim().replace(/\/*$/, '/');

const absolute = (path, base) => {
  const p = String(path || '').trim();
  if (!p || !base) return p;
  return /^https?:/i.test(p) ? p : base + p.replace(/^\.?\//, '');
};

/** Карточка для поисковиков: кто это, чем занимается, как связаться.
 *  Поисковик и без неё разберёт страницу, но здесь всё сказано прямо —
 *  а телефон и мессенджеры берутся из тех же контактов, что на странице,
 *  и не разъедутся с ними при первой же правке. */
function jsonLd(site, base) {
  const m = site.meta || {};
  const contacts = (site.blocks || []).find((b) => b.type === 'contacts');
  const links = (contacts?.data?.items || [])
    .map((c) => String(c.href || ''))
    .filter((h) => /^https?:/i.test(h));
  const phone = (contacts?.data?.items || []).find((c) => String(c.href || '').startsWith('tel:'));

  const card = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: m.title || '',
    description: m.description || '',
    url: base || undefined,
    image: absolute(m.ogImage, base) || undefined,
    areaServed: 'RU',
    availableLanguage: 'ru',
    provider: {
      '@type': 'Person',
      name: site.header?.name || '',
      jobTitle: site.header?.role || '',
    },
    telephone: phone ? phone.href.replace(/^tel:/, '') : undefined,
    sameAs: links.length ? links : undefined,
  };
  // JSON внутри <script> — единственное место, где закрывающий тег в строке
  // оборвал бы скрипт. Экранируем косой чертой: для JSON это тот же символ.
  return JSON.stringify(card, null, 2).replace(/<\//g, '<\\/');
}

/**
 * @param site  разобранный content/site.json
 * @param head  build/partials/doc-head.html — всё до шапки
 * @param tail  build/partials/doc-tail.html — всё после подвала
 * @param opts.base  значение для <base href>, нужно предпросмотру в админке:
 *                   там страница живёт в /admin/, а ссылки на картинки и
 *                   стили в разметке — относительные
 */
export function assemble(site, head, tail, opts = {}) {
  const m = site.meta || {};
  const site_ = siteUrl(m);
  let h = head
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${m.title ?? ''}$2`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${m.description ?? ''}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${site_}`)
    .replace(/(<meta property="og:site_name" content=")[^"]*/, `$1${m.title ?? ''}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${site_}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${m.title ?? ''}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${m.ogDescription ?? ''}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1${absolute(m.ogImage, site_)}`)
    .replace('/*КАРТОЧКА*/', jsonLd(site, site_));

  if (opts.base) h = h.replace('<head>', `<head>\n<base href="${opts.base}">`);

  const blocks = visibleBlocks(site);
  const body = blocks.map(renderBlock).join('\n\n');
  const t = tail.replace('/*ДОКУМЕНТЫ*/', '\n' + docsScript(blocks) + '\n    ');
  const nav = site.nav || [];

  return [
    h,
    renderHeader(site.header || {}, nav),
    '\n<main>\n\n',
    body,
    '\n\n</main>\n\n',
    renderFooter(site.footer || {}, nav),
    '\n',
    t,
  ].join('');
}
