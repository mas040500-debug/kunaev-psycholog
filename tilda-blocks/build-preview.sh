#!/bin/sh
# Склеивает блоки T123 в один файл для локальной проверки в браузере.
# Порядок = порядок блоков на странице в Тильде.
OUT=_preview.html
{
  echo '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width,initial-scale=1">'
  echo '<title>Владимир Кунаев — превью вёрстки</title>'
  echo '<style>body{margin:0}</style></head><body>'
  for f in 00-tokens.html 01-header.html 02-hero.html 03-directions.html \
           04-about.html 05-approach.html 06-education.html 07-contacts.html 08-footer.html; do
    [ -f "$f" ] || continue
    echo "<!-- ===== $f ===== -->"
    cat "$f"
  done
  echo '</body></html>'
} > "$OUT"
echo "собрано: $OUT ($(wc -c < "$OUT") байт)"
