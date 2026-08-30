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
import { dirname, join } from 'node:path';
import { renderBlock } from './blocks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

export function build() {
  const site = JSON.parse(read('content/site.json'));
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

  const blocks = site.blocks.filter((b) => b.visible !== false);
  const body = blocks.map(renderBlock).join('\n\n');

  return head + body + '\n\n' + tail;
}

const html = build();

if (process.argv.includes('--check')) {
  const current = read('index.html');
  if (current === html) {
    console.log('index.html совпадает со сборкой.');
  } else {
    console.log('index.html отличается от сборки — запустите: node build/build.mjs');
    process.exitCode = 1;
  }
} else {
  writeFileSync(join(root, 'index.html'), html);
  const site = JSON.parse(read('content/site.json'));
  const shown = site.blocks.filter((b) => b.visible !== false).length;
  console.log(`index.html собран: блоков ${shown} из ${site.blocks.length}, ${html.length} Б.`);
}
