// Шаблоны блоков: контент приходит из content/site.json, геометрия живёт здесь.
// Кривые SVG, наклоны и размеры — часть дизайна, а не контента, и в JSON
// намеренно не вынесены: их правит дизайнер в коде, а не психолог в админке.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Ссылки приходят из админки, то есть из формы, куда можно вписать что угодно.
// Экранирование кавычек тут не спасает: href="javascript:…" — валидный атрибут
// и исполняемый код. Поэтому схема проверяется по белому списку, а всё
// неопознанное превращается в «#» — ссылка перестаёт работать, но не стреляет.
const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;
const href = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return '#';
  if (s.startsWith('#') || s.startsWith('/') || SAFE_SCHEME.test(s)) return esc(s);
  // относительный путь без схемы (about.html) — тоже безопасен
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) return esc(s);
  return '#';
};

// --- размеченный текст --------------------------------------------------
// Текст из редактора приходит с разметкой: куски фразы могут быть другого
// цвета, кегля, шрифта или начертания. Хранить и отдавать «как есть» нельзя —
// это дыра: в поле можно вписать <script> или картинку с обработчиком.
// Поэтому здесь узкий белый список: только span с классами из шкалы, <b> и
// перенос строки. Всё остальное выбрасывается, текст экранируется.
const RICH_CLASS =
  /^t-(?:color-(?:primary|accent|muted|light)|size-(?:s|l|xl)|font-script|weight-(?:bold|normal))$/;

export function rich(value) {
  const s = String(value ?? '');
  let out = '', last = 0, open = 0;
  const re = /<\/?([a-z0-9]+)([^>]*)>/gi;
  let m;
  while ((m = re.exec(s))) {
    out += esc(s.slice(last, m.index));
    last = re.lastIndex;
    const name = m[1].toLowerCase();
    const closing = m[0].startsWith('</');

    if (name === 'br') { if (!closing) out += '<br>'; continue; }

    if (name === 'span' || name === 'b' || name === 'strong') {
      if (closing) { if (open) { out += '</span>'; open--; } continue; }
      const raw = (m[2].match(/class\s*=\s*"([^"]*)"/i) || ['', ''])[1];
      const classes = raw.split(/\s+/).filter((c) => RICH_CLASS.test(c));
      // <b> из буфера обмена превращаем в свой класс, чтобы на выходе была
      // одна форма записи, а не два способа сказать «жирный»
      if (name !== 'span' && !classes.includes('t-weight-bold')) classes.push('t-weight-bold');
      out += classes.length ? `<span class="${classes.join(' ')}">` : '<span>';
      open++;
      continue;
    }
    // всё прочее — молча выбрасываем вместе с содержимым тега
  }
  out += esc(s.slice(last));
  // незакрытые span закрываем сами: иначе они утекут на остальную страницу
  while (open-- > 0) out += '</span>';
  return out;
}

// --- рваный край между секциями --------------------------------------------
// Цвет — той полосы, которая «наступает» на эту секцию.
const TORN_VAR = { surface: 'var(--bg-surface)', 'second-soft': 'var(--bg-second-soft)', page: 'var(--bg-page)' };

function torn(side, colour) {
  if (!colour) return '';
  return `  <div class="torn torn--${side}" style="--torn-color: ${TORN_VAR[colour]}" aria-hidden="true">
    <svg viewBox="0 0 1440 40" preserveAspectRatio="none"><use href="#torn-path"/></svg>
  </div>`;
}

// --- геометрия, зашитая в шаблоны ------------------------------------------
const CARD_SHAPES = [
  'M0 38A24 24 0 0 1 24 14L54 2L84 16L114 5L144 18L174 3L204 15L234 6L264 17L294 4L324 14L354 8A24 24 0 0 1 378 32L378 186A24 24 0 0 1 354 210L24 210A24 24 0 0 1 0 186Z',
  'M0 39A24 24 0 0 1 24 15L54 15L84 4L114 17L144 6L174 16L204 2L234 13L264 5L294 18L324 7L354 15A24 24 0 0 1 378 39L378 186A24 24 0 0 1 354 210L24 210A24 24 0 0 1 0 186Z',
  'M0 32A24 24 0 0 1 24 8L54 8L84 18L114 3L144 14L174 7L204 17L234 4L264 12L294 6L324 16L354 5A24 24 0 0 1 378 29L378 186A24 24 0 0 1 354 210L24 210A24 24 0 0 1 0 186Z',
];

const NOTE_SHAPES = [
  { cls: 'a', box: '0 0 377 217', d: 'M7.0496 0.980594L36.2541 8.0041L64.9316 4.91764e-05L94.1012 8.02294L122.674 3.01707L151.809 12.0393L180.381 7.03348L198.222 8.1568L209.656 12.0582L228.774 6.72216L242.589 17.711L277.657 7.42859L312.604 15.6532L337.535 9.51958L361.908 19.3762L376.859 12.894L369.74 216.77L202.92 204.941L173.367 207.911L145.178 201.924L115.589 205.893L87.4703 197.907L57.8121 203.876L29.693 195.89L-0.000100475 202.858L7.0496 0.980594Z' },
  { cls: 'b', box: '0 0 373 183', d: 'M-0.000169451 8.36137L29.5176 13.0314L57.7583 4.76056L87.2912 10.2945L115.577 4.61554L145.125 11.0135L173.411 5.33447L191.285 5.45458L202.899 8.2766L221.726 2.76271L236.072 11.5865L270.581 1.04573L305.894 6.4788L330.487 7.31105e-05L355.32 7.34448L369.928 1.04003L373.005 177.285L205.809 175.018L176.442 178.988L147.99 175.163L118.638 179.997L90.1564 174.444L60.8347 181.006L32.3527 175.453L3.04604 182.878L-0.000169451 8.36137Z' },
  { cls: 'c', box: '0 0 376 189', d: 'M6.09166 0.573076L35.3246 6.78154L63.9594 4.8961e-05L93.1622 7.07206L121.707 2.88123L150.879 10.8168L179.424 6.62596L197.267 7.68136L208.717 11.1073L227.807 6.58632L241.672 16.1488L276.685 7.42858L311.665 14.7024L336.563 9.51958L360.978 18.1536L375.896 12.6223L369.745 188.787L202.897 177.773L173.362 180.2L145.15 174.892L115.585 178.182L87.4326 171.147L57.8076 176.165L29.6553 169.129L0.000174471 175.01L6.09166 0.573076Z' },
];

const PHOTO_CARD_OUTLINE = 'M427 0C435.836 0 443 7.16356 443 16V504C443 512.837 435.837 520 427 520H16C7.16344 520 0 512.837 0 504V16C0.000131435 7.16356 7.16353 2.05352e-07 16 0H427ZM27.3037 464.236C21.2286 464.236 16.3037 469.161 16.3037 475.236C16.3037 481.311 21.2286 486.236 27.3037 486.236C33.3788 486.236 38.3037 481.311 38.3037 475.236C38.3037 469.161 33.3788 464.236 27.3037 464.236ZM27.3037 378.236C21.2286 378.236 16.3037 383.161 16.3037 389.236C16.3037 395.311 21.2286 400.236 27.3037 400.236C33.3788 400.236 38.3037 395.311 38.3037 389.236C38.3037 383.161 33.3788 378.236 27.3037 378.236ZM27.3037 292.236C21.2286 292.236 16.3037 297.161 16.3037 303.236C16.3037 309.311 21.2286 314.236 27.3037 314.236C33.3788 314.236 38.3037 309.311 38.3037 303.236C38.3037 297.161 33.3788 292.236 27.3037 292.236ZM27.3037 206.236C21.2286 206.236 16.3037 211.161 16.3037 217.236C16.3037 223.311 21.2286 228.236 27.3037 228.236C33.3788 228.236 38.3037 223.311 38.3037 217.236C38.3037 211.161 33.3788 206.236 27.3037 206.236ZM27.3037 120.236C21.2286 120.236 16.3037 125.161 16.3037 131.236C16.3037 137.311 21.2286 142.236 27.3037 142.236C33.3788 142.236 38.3037 137.311 38.3037 131.236C38.3037 125.161 33.3788 120.236 27.3037 120.236ZM27.3037 34.2363C21.2286 34.2363 16.3037 39.1612 16.3037 45.2363C16.3037 51.3115 21.2286 56.2363 27.3037 56.2363C33.3788 56.2363 38.3037 51.3115 38.3037 45.2363C38.3037 39.1612 33.3788 34.2363 27.3037 34.2363Z';
const PLATE_SHAPE = 'M0 0L26.3455 4.87179L51.75 1.94872L78.0955 7.79487L103.5 0.974359L129.845 6.82051L155.25 0L181.595 7.79487L207 0.974359V76L181.595 70.1538L155.25 76L129.845 71.1282L103.5 76L78.0955 70.1538L51.75 76L26.3455 69.1795L0 74.0513V0Z';

const CONTACT_ICONS = {
  phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24"><path d="M21 5 3 11.5l5 1.8L19 7.5l-8.5 8.2v4l3-3.3 4.2 3.1L21 5Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z"/><path d="M9 9c0 3 3 6 6 6l1.2-1.6-2-1-1 1a6.6 6.6 0 0 1-2.6-2.6l1-1-1-2L9 9Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><path d="M3 6h18v12H3V6Zm1.5 1.5 7.5 5.5 7.5-5.5"/></svg>',
  vk: '<svg viewBox="0 0 24 24"><path d="M3 7h3c.4 3.5 1.9 5.7 3 6V7h3v4.3c1.1-.2 2.3-1.9 2.7-4.3H18c-.3 2.4-1.4 4.2-2.5 5 1.1.7 2.4 2.3 3 5h-3.2c-.5-1.7-1.6-3-2.3-3.2V17h-.6C7.9 17 4 13.5 3 7Z"/></svg>',
  site: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-2.5 2.2-3.8 5.2-3.8 9s1.3 6.8 3.8 9c2.5-2.2 3.8-5.2 3.8-9S14.5 5.2 12 3ZM3.5 9h17M3.5 15h17"/></svg>',
};

// data-block стоит всегда: по нему админка находит секцию в предпросмотре и
// прокручивает к ней. id есть у КАЖДОГО блока, даже если якорь ему не задавали: иначе на блок
// нельзя сослаться из меню, а владелец сайта не может завести якорь сам —
// это уже не контент. Свой якорь, если он задан, имеет приоритет: по нему
// уже могли раздать ссылки, и менять его нельзя.
const anchor = (b) => ` id="${b.anchor || b.id}" data-block="${b.id}"`;

const BG_CLASS = { surface: 'section--surface', 'second-soft': 'section--second', page: 'section--page' };
const bgClass = (b) => BG_CLASS[b.bg] || 'section--surface';

// Оформление простых блоков. Владелец сайта выбирает не «любой цвет и любой
// кегль», а ступень из шкалы: цвета — только те, что гарантированно читаются
// на всех трёх фонах, шрифта два, размеров три. Свободный выбор дал бы через
// месяц серый текст на сиреневом и восемь разных кеглей на одной странице.
const styleClass = (s = {}) =>
  [
    s.color && s.color !== 'default' ? `is-color-${s.color}` : '',
    s.font === 'script' ? 'is-font-script' : '',
    s.size && s.size !== 'm' ? `is-size-${s.size}` : '',
    s.gap && s.gap !== 'm' ? `is-gap-${s.gap}` : '',
    s.weight && s.weight !== 'normal' ? `is-weight-${s.weight}` : '',
  ].filter(Boolean).join(' ');

// Выравнивание — тоже ступень, но с оговоркой: у каждого типа блока своя
// заготовка. Цитата и призыв задуманы по центру, текст — от левого края.
// Поэтому класс ставится всегда, а «по умолчанию» у каждого своё: иначе
// блок, которому выравнивание не трогали, поехал бы при первой же правке.
const ALIGNS = ['left', 'center', 'right'];
const alignClass = (d = {}, fallback = 'left') => {
  // d.align — прежний формат блока «Заголовок с текстом», до переезда в style
  const a = d.style?.align || d.align || fallback;
  return `is-align-${ALIGNS.includes(a) ? a : fallback}`;
};

const cls = (...parts) => parts.filter(Boolean).join(' ');

// абзацы: пустая строка в тексте делит его на <p>
const paras = (text, cls) =>
  String(text || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `      <p class="${cls}">${rich(p.trim())}</p>`)
    .join('\n');

// --- блоки -----------------------------------------------------------------
const templates = {
  hero(b) {
    const d = b.data;
    return `<!-- ==================== ГЕРОЙ ==================== -->
<section class="${cls('section', 'section--surface hero', alignClass(d, 'left'))}"${anchor(b)}>
  <div class="hero__inner">
    <div class="hero__text">
      <p class="eyebrow">${rich(d.eyebrow)}</p>
      <!-- Заголовок — один текст, а не три строки: сколько строк получится,
           решает ширина экрана, а не вёрстка. Выделения внутри задаются
           разметкой из редактора. -->
      <h1 class="hero__title">${rich(d.title)}</h1>
      <a class="btn" href="${href(d.cta.href)}">${esc(d.cta.label)}</a>
    </div>

    <div class="hero__media">
      <!-- Подложка карточки — единый контур: отверстия перфорации ВЫРЕЗАНЫ
           из сиреневой панели (fill-rule="evenodd"), а не нарисованы
           кружками поверх, поэтому сквозь них видно фон страницы. -->
      <div class="photo-card">
        <svg class="photo-card__bg" viewBox="0 0 443 520" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#F3EDFF" fill-rule="evenodd" clip-rule="evenodd" d="${PHOTO_CARD_OUTLINE}"/>
        </svg>
        <img class="photo-card__img" src="${esc(d.photo.src)}" alt="${esc(d.photo.alt)}" width="${d.photo.width}" height="${d.photo.height}">
        <div class="photo-card__plate">
          <svg class="photo-card__plate-bg" viewBox="0 0 207 76" preserveAspectRatio="none" aria-hidden="true">
            <path fill="#4B82FF" d="${PLATE_SHAPE}"/>
          </svg>
          <span class="photo-card__signature">${esc(d.plate.signature)}</span>
          <span class="photo-card__caption">${esc(d.plate.caption)}</span>
        </div>
      </div>
    </div>
  </div>

${torn('bottom', b.torn.bottom)}
</section>`;
  },

  cards(b) {
    const d = b.data;
    const cards = d.cards.map((c, i) => `    <article class="card">
      <svg class="card__bg" viewBox="0 0 378 210" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#FFFFFF" d="${CARD_SHAPES[i % CARD_SHAPES.length]}"/>
      </svg>
      <h3 class="card__title">${rich(c.title)}</h3>
      <ul class="card__list">
${c.items.map((it) => `        <li>${esc(it)}</li>`).join('\n')}
      </ul>
    </article>`).join('\n\n');

    return `<!-- ==================== НАПРАВЛЕНИЯ ==================== -->
<section class="${cls('section', 'section--second dir', alignClass(d, 'center'))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <p class="eyebrow">${rich(d.eyebrow)}</p>

  <h2 class="dir__title">${rich(d.title)}</h2>

  <!-- Силуэт карточки нарисован SVG, а не border-radius: сверху у неё
       рваный край — тот же бумажный мотив, что у разделителей секций.
       У каждой карточки своя кривая, чтобы «оторванные» листы
       не выглядели штампованными. -->
  <div class="dir__cards">
${cards}
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  about(b) {
    const d = b.data;
    return `<!-- ==================== ОБО МНЕ ==================== -->
<section class="${cls('section', 'section--surface about', alignClass(d, 'left'))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <p class="eyebrow">${rich(d.eyebrow)}</p>

  <div class="about__stage">
    <span class="about__watermark" aria-hidden="true">${esc(d.watermark)}</span>
    <img class="about__photo" src="${esc(d.photo.src)}" alt="${esc(d.photo.alt)}" width="${d.photo.width}" height="${d.photo.height}">
  </div>

  <div class="about__statement">
    <h2 class="about__lead">${rich(d.lead)}</h2>
    <div class="about__col">
      <p class="about__body">${rich(d.body)}</p>
      <p class="about__tags">${rich(d.tags)}</p>
    </div>
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  marquee(b) {
    const d = b.data;
    const set = (hidden) => `    <ul class="marquee__set"${hidden ? ' aria-hidden="true"' : ''}>
${d.words.map((w) => `      <li>${esc(w)}</li>`).join('\n')}
    </ul>`;

    return `<!-- ==================== БЕГУЩАЯ СТРОКА ====================
     Лента едет за счёт одной анимации на дорожке. Внутри дорожки два
     одинаковых набора слов: пока первый уезжает влево ровно на свою
     ширину, второй занимает его место — стык не виден, и лента
     выглядит бесконечной. Второй набор дублирующий, поэтому скрыт от
     скринридеров. -->
<section class="marquee" aria-label="${esc(d.label)}"${anchor(b)}>
${torn('top', b.torn.top)}
  <div class="marquee__track">
${set(false)}
${set(true)}
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  principles(b) {
    const d = b.data;
    const notes = d.notes.map((n, i) => {
      const s = NOTE_SHAPES[i % NOTE_SHAPES.length];
      return `    <article class="note note--${s.cls}">
      <svg class="note__bg" viewBox="${s.box}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${s.d}"/>
      </svg>
      <div class="note__body">
        <h3 class="note__title">${rich(n.title)}</h3>
        <p class="note__text">${esc(n.text)}</p>
      </div>
    </article>`;
    }).join('\n\n');

    return `<!-- ==================== ПОДХОД ==================== -->
<section class="${cls('section', 'section--surface appr', alignClass(d, 'center'))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <div class="appr__head">
    <p class="eyebrow">${rich(d.eyebrow)}</p>
    <h2 class="appr__title">${rich(d.title)}</h2>
    <p class="appr__sub">${rich(d.sub)}</p>
  </div>

  <div class="appr__map">
    <svg class="appr__links" viewBox="0 0 1440 350" preserveAspectRatio="none" aria-hidden="true">
      <g transform="translate(299,0)"><path d="M224.957 0.101562C212.457 122.602 42.457 0.101562 0.957031 137.102"/></g>
      <g transform="translate(905,9)"><path d="M0.754883 0.656006C77.2549 88.6561 201.755 0.656006 223.255 125.156"/></g>
      <g transform="translate(684,69)"><path d="M13.6192 0.589111C-32.6814 64.0891 67.32 92.5891 13.6192 182.089"/></g>
    </svg>

${notes}
  </div>

${torn('bottom', b.torn.bottom)}
</section>`;
  },

  education(b) {
    const d = b.data;
    // первый документ попадает прямо в разметку, чтобы папка была видна
    // до того, как отработает скрипт карусели
    const first = d.docs[0];
    return `<!-- ==================== ОБРАЗОВАНИЕ ==================== -->
<section class="${cls('edu', alignClass(d, 'left'))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <!-- Папка собрана вёрсткой, а не картинкой: так бумажка с подписью
       масштабируется вместе с ней на всех экранах. Геометрия — из макета,
       в процентах от системы координат коллажа 690×654. -->
  <div class="edu__art">
    <div class="edu__folder">
      <span class="edu__spine" aria-hidden="true"></span>

      <svg class="edu__body" viewBox="24 12 540 629" preserveAspectRatio="none" aria-hidden="true">
        <path d="M24 32C24 20.9543 32.9543 12 44 12L514 12C525.046 12 534 20.9543 534 32V145.333C534 149.661 535.404 153.871 538 157.333L560 186.667C562.596 190.129 564 194.339 564 198.667V621C564 632.046 555.046 641 544 641H44C32.9543 641 24 632.046 24 621V32Z"/>
      </svg>

      <span class="edu__ring" style="--y:20.34%" aria-hidden="true"></span>
      <span class="edu__ring" style="--y:39.91%" aria-hidden="true"></span>
      <span class="edu__ring" style="--y:59.48%" aria-hidden="true"></span>
      <span class="edu__ring" style="--y:79.05%" aria-hidden="true"></span>

      <span class="edu__sheet" aria-hidden="true"></span>

      <a class="edu__doc" id="edu-link" href="assets/docs/${esc(first.src)}" target="_blank" rel="noopener"
         title="Открыть документ в полном размере">
        <img class="edu__doc-img" id="edu-img" src="assets/docs/${esc(first.src)}"
             alt="${esc(first.alt)}" width="393" height="556">
      </a>

      <!-- Бумажка — обёртка вокруг подписи, а не отдельный прямоугольник
           фиксированной высоты: подписи у документов от одной до трёх
           строк, и бумажка должна расти под них, а не обрезать текст. -->
      <div class="edu__note">
        <div class="edu__label" aria-live="polite">
          <span class="edu__label-script" id="edu-note-title">${esc(first.note)}</span>
          <span class="edu__label-sub" id="edu-note-sub">${esc(first.sub)}</span>
        </div>
      </div>

      <span class="edu__clip-wire" aria-hidden="true"></span>
      <span class="edu__clip" aria-hidden="true"></span>
    </div>
  </div>

  <div class="edu__text">
    <p class="eyebrow">${rich(d.eyebrow)}</p>
    <h2 class="edu__title">${rich(d.title)}</h2>
    <p class="edu__body">${rich(d.body)}</p>
  </div>

  <!-- Стрелки — отдельный элемент секции, а не часть текстовой колонки:
       на телефоне блок становится колонкой, и стрелки должны идти сразу
       под папкой. Внутри текста они уезжали за нижний край экрана, и люди
       просто не находили, чем листать. Раскладку задаёт сетка ниже. -->
  <div class="edu__nav">
    <button class="edu__arrow" type="button" id="edu-prev" aria-label="Предыдущий документ">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
    <button class="edu__arrow" type="button" id="edu-next" aria-label="Следующий документ">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
    </button>
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  contacts(b) {
    const d = b.data;
    const items = d.items.map((c) => {
      // «внешность» ссылки выводится из неё самой, а не хранится отдельным
      // флагом: два поля об одном и том же рано или поздно разъезжаются
      const ext = /^https?:/i.test(c.href) ? ' target="_blank" rel="noopener"' : '';
      return `    <a class="contact" href="${href(c.href)}"${ext}>
      <span class="contact__icon" aria-hidden="true">
        ${CONTACT_ICONS[c.icon]}
      </span>
      <span class="contact__body">
        <span class="contact__label">${rich(c.label)}</span>
        <span class="contact__value">${rich(c.value)}</span>
      </span>
    </a>`;
    }).join('\n\n');

    return `<!-- ==================== КОНТАКТЫ ==================== -->
<section class="${cls('section', 'section--surface contacts', alignClass(d, 'center'))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <div class="contacts__head">
    <p class="eyebrow">${rich(d.eyebrow)}</p>
    <h2 class="contacts__title">${rich(d.title)}</h2>
    <p class="contacts__sub">${rich(d.sub)}</p>
  </div>

  <div class="contacts__cards">
${items}
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  // ---- простые блоки: их владелец сайта добавляет сам ----------------------
  // Все они держат общую сетку и типографику страницы, поэтому что бы в них
  // ни написали, вёрстка не поедет: ширина текста, кегли и отступы заданы
  // здесь, а не в контенте.

  text(b) {
    const d = b.data;
    return `<!-- ==================== ТЕКСТ ==================== -->
<section class="${cls('section', bgClass(b), 'simple simple--text', alignClass(d, 'left'), styleClass(d.style))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <div class="simple__inner">
${d.eyebrow ? `      <p class="eyebrow">${rich(d.eyebrow)}</p>\n` : ''}${d.title ? `      <h2 class="simple__title">${rich(d.title)}</h2>\n` : ''}${paras(d.body, 'simple__body')}
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  image(b) {
    const d = b.data;
    return `<!-- ==================== КАРТИНКА ==================== -->
<section class="${cls('section', bgClass(b), 'simple simple--image', alignClass(d, 'center'), styleClass(d.style))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <figure class="simple__figure">
    <img src="${esc(d.src)}" alt="${esc(d.alt || '')}"${d.width ? ` width="${d.width}"` : ''}${d.height ? ` height="${d.height}"` : ''}>
${d.caption ? `    <figcaption class="simple__caption">${rich(d.caption)}</figcaption>\n` : ''}  </figure>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  media(b) {
    const d = b.data;
    const side = d.imageSide === 'right' ? 'simple--media-right' : '';
    return `<!-- ==================== КАРТИНКА С ТЕКСТОМ ==================== -->
<section class="${cls('section', bgClass(b), 'simple simple--media', side, alignClass(d, 'left'), styleClass(d.style))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <div class="simple__media">
    <img src="${esc(d.src)}" alt="${esc(d.alt || '')}"${d.width ? ` width="${d.width}"` : ''}${d.height ? ` height="${d.height}"` : ''}>
  </div>

  <div class="simple__inner">
${d.eyebrow ? `      <p class="eyebrow">${rich(d.eyebrow)}</p>\n` : ''}${d.title ? `      <h2 class="simple__title">${rich(d.title)}</h2>\n` : ''}${paras(d.body, 'simple__body')}
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  quote(b) {
    const d = b.data;
    return `<!-- ==================== ЦИТАТА ==================== -->
<section class="${cls('section', bgClass(b), 'simple simple--quote', alignClass(d, 'center'), styleClass(d.style))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <blockquote class="quote">
    <p class="quote__text">${rich(d.text)}</p>
${d.author ? `    <footer class="quote__author">${rich(d.author)}</footer>\n` : ''}  </blockquote>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  cta(b) {
    const d = b.data;
    return `<!-- ==================== ПРИЗЫВ ==================== -->
<section class="${cls('section', bgClass(b), 'simple simple--cta', alignClass(d, 'center'), styleClass(d.style))}"${anchor(b)}>
${torn('top', b.torn.top)}
  <div class="simple__inner">
${d.title ? `      <h2 class="simple__title">${rich(d.title)}</h2>\n` : ''}${paras(d.body, 'simple__body')}
    <a class="btn" href="${href(d.button.href)}">${esc(d.button.label)}</a>
  </div>
${torn('bottom', b.torn.bottom)}
</section>`;
  },

  spacer(b) {
    const size = ['s', 'm', 'l'].includes(b.data?.size) ? b.data.size : 'm';
    return `<!-- ==================== ОТСТУП ==================== -->
<section class="${bgClass(b)} spacer spacer--${size}"${anchor(b)} aria-hidden="true">
${torn('top', b.torn.top)}${torn('bottom', b.torn.bottom)}
</section>`;
  },
};

// --- шапка и подвал ---------------------------------------------------------
// Одно и то же меню выводится трижды: в шапке, в мобильной шторке и в подвале.
// Все три собираются из одного списка nav — иначе пункт, добавленный в одном
// месте, тихо не появился бы в двух других.

export function renderHeader(header = {}, nav = []) {
  const links = (indent) => nav.map((n) => `${indent}<a href="${href(n.href)}">${esc(n.label)}</a>`).join('\n');
  return `<!-- ==================== ШАПКА ==================== -->
<header class="header" id="top">
  <div class="header__bar">
    <a class="header__brand" href="#top">
      <img class="header__avatar" src="${esc(header.avatar)}" alt="" width="48" height="48">
      <span class="header__ident">
        <span class="header__name">${rich(header.name)}</span>
        <span class="header__role">${rich(header.role)}</span>
      </span>
    </a>

    <nav class="header__nav" aria-label="Основная навигация">
${links('      ')}
    </nav>

    <a class="btn header__cta" href="${href(header.cta.href)}">${esc(header.cta.label)}</a>

    <button class="header__burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="drawer">
      <span></span><span></span><span></span>
    </button>
  </div>

  <nav class="header__drawer" id="drawer" aria-label="Мобильная навигация">
${links('    ')}
    <a class="btn" href="${href(header.cta.href)}">${esc(header.cta.label)}</a>
  </nav>
</header>
`;
}

export function renderFooter(footer = {}, nav = []) {
  return `<!-- ==================== ПОДВАЛ ==================== -->
<footer class="footer">
  <div class="footer__top">
    <div class="footer__ident">
      <span class="footer__name">${rich(footer.name)}</span>
      <span class="footer__role">${rich(footer.role)}</span>
    </div>

    <nav class="footer__nav" aria-label="Навигация в подвале">
${nav.map((n) => `      <a href="${href(n.href)}">${esc(n.label)}</a>`).join('\n')}
    </nav>
  </div>

  <hr class="footer__rule">

  <div class="footer__legal">
    <span>${rich(footer.copyright)}</span>
    <a href="${href(footer.policyHref)}">${esc(footer.policyLabel)}</a>
  </div>
</footer>
`;
}

export function renderBlock(block) {
  const fn = templates[block.type];
  if (!fn) throw new Error(`Неизвестный тип блока: ${block.type}`);
  // пустые строки от несуществующих рваных краёв схлопываем
  return fn(block).replace(/\n\n(?=\n)/g, '').replace(/\n{3,}/g, '\n\n');
}

export const blockTypes = Object.keys(templates);
