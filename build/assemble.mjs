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
  let h = head
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${m.title ?? ''}$2`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${m.description ?? ''}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${m.title ?? ''}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${m.ogDescription ?? ''}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1${m.ogImage ?? ''}`);

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
