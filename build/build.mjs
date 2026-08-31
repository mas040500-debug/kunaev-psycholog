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
import { assemble, siteUrl } from './assemble.mjs';

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

  // robots.txt и карта сайта собираются, а не лежат готовыми: адрес сайта
  // записан один раз, в meta.siteUrl, и при переезде на свой домен эти два
  // файла обновятся сами. Разъехавшаяся карта сайта хуже отсутствующей —
  // она уводит поисковик на адрес, которого уже нет.
  const base = siteUrl(site.meta || {});
  if (base) {
    // Редактор закрыт от поисковиков: страница входа в выдаче не нужна
    // никому. На самих страницах админки стоит ещё и noindex — заголовок
    // надёжнее, robots.txt лишь просьба не заходить.
    writeFileSync(abs('robots.txt'),
      `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${base}sitemap.xml\n`);
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync(abs('sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n    <loc>${base}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n` +
      `</urlset>\n`);
    console.log(`robots.txt и sitemap.xml: адрес ${base}`);
  } else {
    console.log('robots.txt и sitemap.xml пропущены: в meta.siteUrl пусто.');
  }
}
