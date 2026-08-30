// Сборка index.html из content/site.json.
//
// Запуск:  node build/build.mjs                          — собрать index.html
//          node build/build.mjs --check                   — проверить, не записывая
//          node build/build.mjs --content=… --out=…        — собрать из другого файла
//
// Сама сборка живёт в assemble.mjs и не знает про файловую систему: тот же
// модуль работает в браузере и даёт предпросмотр в админке.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { assemble } from './assemble.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// пути можно передавать и относительно корня проекта, и абсолютные
const abs = (p) => (isAbsolute(p) ? p : join(root, p));
const read = (p) => readFileSync(abs(p), 'utf8');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

export function build(contentPath = 'content/site.json') {
  return assemble(
    JSON.parse(read(contentPath)),
    read('build/partials/doc-head.html'),
    read('build/partials/doc-tail.html'),
  );
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

  // Опись картинок для админки: браузер не умеет читать каталог, поэтому
  // список файлов собирается здесь и кладётся рядом с контентом.
  const IMG = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
  const scan = (dir) =>
    readdirSync(abs(dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? scan(`${dir}/${e.name}`) : IMG.test(e.name) ? [`${dir}/${e.name}`] : []);
  const assets = scan('assets').sort();
  writeFileSync(abs('content/assets.json'), JSON.stringify(assets, null, 2) + '\n');
  console.log(`content/assets.json: картинок ${assets.length}.`);
}
