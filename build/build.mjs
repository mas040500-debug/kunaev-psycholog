// Сборка index.html из content/site.json.
//
// Запуск:  node build/build.mjs           — собрать и записать index.html
//          node build/build.mjs --check    — только проверить, не записывая
//
// Шапка и подвал лежат в build/partials/ как есть: там нет ничего, что
// правил бы психолог, и хранить их шаблонами значило бы переписывать
// разметку без нужды.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { renderBlock } from './blocks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// пути можно передавать и относительно корня проекта, и абсолютные
const abs = (p) => (isAbsolute(p) ? p : join(root, p));
const read = (p) => readFileSync(abs(p), 'utf8');

// Рваные края считаются по фактическому порядку блоков, а не задаются руками.
// Иначе стоит спрятать блок — и у соседа остаётся край чужого цвета: сиреневый
// на белом фоне. Проверено на скрытой бегущей строке, до этой функции так и было.
//
// Правило. Край нужен там, где у соседних блоков разный фон. По умолчанию его
// рисует НИЖНИЙ блок краем сверху, залитым цветом верхнего. Блок с флагом
// tearInto: "next" вместо этого рвётся вниз сам — это зеркальный вариант, он
// стоит у героя и у «Подхода», и без флага граница выглядела бы иначе.
function assignTorn(blocks) {
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

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

export function build(contentPath = arg('content', 'content/site.json')) {
  const site = JSON.parse(read(contentPath));
  let head = read('build/partials/head.html');
  const tail = read('build/partials/tail.html');

  // мета-теги подставляются в шапку
  const m = site.meta;
  head = head
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${m.title}$2`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${m.description}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${m.title}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${m.ogDescription}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1${m.ogImage}`);

  const blocks = assignTorn(site.blocks.filter((b) => b.visible !== false));
  const body = blocks.map(renderBlock).join('\n\n');

  // Карусель дипломов берёт список из контента, а не из зашитого в скрипт
  // массива: иначе у сканов было бы два источника правды.
  const edu = blocks.find((b) => b.type === 'education');
  const docs = edu ? edu.data.docs : [];
  // собираем построчно, а не правкой JSON регулярками: в подписях бывают
  // кавычки и запятые, и любая такая правка рано или поздно их зацепит
  const docsJs = docs
    .map((d) => {
      const f = (k) => `${k}: ${JSON.stringify(d[k] ?? '')}`;
      return `      { ${f('src')}, ${f('note')}, ${f('sub')},\n        ${f('alt')} }`;
    })
    .join(',\n');

  return head + body + '\n\n' + tail.replace('/*ДОКУМЕНТЫ*/', '\n' + docsJs + '\n    ');
}

const contentPath = arg('content', 'content/site.json');
const outPath = arg('out', 'index.html');
const html = build(contentPath);

if (process.argv.includes('--check')) {
  if (read(outPath) === html) {
    console.log(`${outPath} совпадает со сборкой.`);
  } else {
    console.log(`${outPath} отличается от сборки — запустите: node build/build.mjs`);
    process.exitCode = 1;
  }
} else {
  writeFileSync(abs(outPath), html);
  const site = JSON.parse(read(contentPath));
  const shown = site.blocks.filter((b) => b.visible !== false).length;
  console.log(`${outPath} собран: блоков ${shown} из ${site.blocks.length}, ${html.length} Б.`);
}
