// Описание блоков: какие бывают, как называются по-человечески и какие у них
// поля. Это контракт между контентом, шаблонами и админкой: формы строятся по
// этому файлу, иначе новый блок означал бы правку в трёх местах.
//
// Типы полей:
//   text     — однострочное поле
//   textarea — многострочное; пустая строка делит текст на абзацы
//   lines    — список коротких строк, по одной на строку ввода
//   image    — картинка из assets/
//   link     — ссылка или якорь (#contacts)
//   select   — выбор из options
//   list     — повторяющиеся элементы, поля описаны в of

export const BACKGROUNDS = [
  { value: 'surface', label: 'Белый' },
  { value: 'second-soft', label: 'Сиреневый' },
  { value: 'page', label: 'Светло-голубой' },
];

// --- блоки страницы: по одному экземпляру, состав задан дизайном ------------
const UNIQUE = {
  hero: {
    label: 'Первый экран',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'titleTop', label: 'Заголовок, первая строка', type: 'text' },
      { key: 'titleScript', label: 'Вторая строка, от руки', type: 'text',
        hint: 'Набирается рукописным шрифтом. Держите её короткой — она не переносится.' },
      { key: 'titleBottom', label: 'Третья строка', type: 'text' },
      { key: 'cta.label', label: 'Надпись на кнопке', type: 'text' },
      { key: 'cta.href', label: 'Куда ведёт кнопка', type: 'target' },
      { key: 'photo.src', label: 'Фотография', type: 'image' },
      { key: 'photo.alt', label: 'Описание фотографии', type: 'text' },
      { key: 'plate.signature', label: 'Подпись на плашке', type: 'text' },
      { key: 'plate.caption', label: 'Вторая строка на плашке', type: 'text' },
    ],
  },

  cards: {
    label: 'Направления',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'titleAccent', label: 'Продолжение цветом', type: 'text' },
      { key: 'cards', label: 'Карточки', type: 'list', itemLabel: 'Карточка', of: [
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'items', label: 'Пункты', type: 'lines' },
      ] },
    ],
  },

  about: {
    label: 'Обо мне',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'watermark', label: 'Слово за фотографией', type: 'text' },
      { key: 'photo.src', label: 'Фотография', type: 'image' },
      { key: 'photo.alt', label: 'Описание фотографии', type: 'text' },
      { key: 'lead', label: 'Крупная фраза', type: 'text' },
      { key: 'leadAccent', label: 'Её продолжение цветом', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea' },
      { key: 'tags', label: 'Строка через дробь', type: 'text' },
    ],
  },

  marquee: {
    label: 'Бегущая строка',
    fields: [
      { key: 'words', label: 'Слова', type: 'lines', hint: 'По одному на строку. Лента повторяет их по кругу.' },
      { key: 'label', label: 'Описание для незрячих', type: 'text' },
    ],
  },

  principles: {
    label: 'Принципы работы',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'sub', label: 'Подзаголовок', type: 'textarea' },
      { key: 'notes', label: 'Записки', type: 'list', itemLabel: 'Записка', max: 3, of: [
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'text', label: 'Текст', type: 'textarea' },
      ] },
    ],
  },

  education: {
    label: 'Образование',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea' },
      { key: 'docs', label: 'Документы', type: 'list', itemLabel: 'Документ', of: [
        { key: 'src', label: 'Скан', type: 'image', dir: 'assets/docs/' },
        { key: 'note', label: 'Подпись от руки', type: 'text' },
        { key: 'sub', label: 'Вторая строка', type: 'text' },
        { key: 'alt', label: 'Описание для незрячих', type: 'text' },
      ] },
    ],
  },

  contacts: {
    label: 'Контакты',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'sub', label: 'Подзаголовок', type: 'textarea' },
      { key: 'items', label: 'Способы связи', type: 'list', itemLabel: 'Способ', of: [
        { key: 'icon', label: 'Значок', type: 'select', options: [
          { value: 'phone', label: 'Телефон' },
          { value: 'telegram', label: 'Telegram' },
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'mail', label: 'Почта' },
          { value: 'vk', label: 'ВКонтакте' },
          { value: 'site', label: 'Другая ссылка' } ] },
        { key: 'label', label: 'Название', type: 'text' },
        { key: 'value', label: 'Что показывать', type: 'text' },
        { key: 'href', label: 'Ссылка', type: 'link',
          hint: 'Телефон — tel:+79991234567, почта — mailto:имя@почта.ру, остальное — полный адрес со https://. Номер в wa.me пишется без плюса и скобок.' },
      ] },
    ],
  },
};

// Оформление простых блоков. Ступени, а не произвольные значения: цвета —
// только читаемые на всех трёх фонах, шрифта два, размера три. Свободный
// выбор дал бы через месяц серый текст на сиреневом и восемь кеглей на
// одной странице, а чинить это пришлось бы дизайнеру.
export const ALIGN_FIELD = {
  key: 'style.align', label: 'Выравнивание', type: 'select', options: [
    { value: 'left', label: 'По левому краю' },
    { value: 'center', label: 'По центру' },
    { value: 'right', label: 'По правому краю' } ],
};

export const STYLE_FIELDS = [
  { key: 'style.color', label: 'Цвет текста', type: 'select', options: [
    { value: 'default', label: 'Обычный' },
    { value: 'primary', label: 'Тёмный' },
    { value: 'accent', label: 'Синий' },
    { value: 'muted', label: 'Приглушённый' } ] },
  { key: 'style.font', label: 'Шрифт', type: 'select', options: [
    { value: 'base', label: 'Основной' },
    { value: 'script', label: 'Рукописный' } ],
    hint: 'Рукописный — для короткой фразы. Длинный текст им читать тяжело.' },
  { key: 'style.size', label: 'Размер текста', type: 'select', options: [
    { value: 's', label: 'Мелкий' },
    { value: 'm', label: 'Обычный' },
    { value: 'l', label: 'Крупный' } ] },
  ALIGN_FIELD,
  { key: 'style.gap', label: 'Отступы внутри блока', type: 'select', options: [
    { value: 's', label: 'Плотно' },
    { value: 'm', label: 'Обычно' },
    { value: 'l', label: 'Просторно' } ] },
];

const STYLE_DEFAULTS = { color: 'default', font: 'base', size: 'm', gap: 'm' };

// Заготовка выравнивания у каждого типа своя: цитата, призыв и картинка
// задуманы по центру, текст — от левого края. Общее значение сдвинуло бы
// половину блоков при первом же открытии формы.
const ALIGN_DEFAULTS = { text: 'left', image: 'center', media: 'left', quote: 'center', cta: 'center' };

// --- простые блоки: их можно добавлять сколько угодно и куда угодно ---------
export const SIMPLE = {
  text: {
    label: 'Заголовок с текстом',
    defaults: { eyebrow: '', title: 'Заголовок', body: 'Текст блока.' },
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text', hint: 'Можно оставить пустым.' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea', hint: 'Пустая строка разделяет абзацы.' },
    ],
  },
  image: {
    label: 'Картинка',
    defaults: { src: '', alt: '', caption: '' },
    fields: [
      { key: 'src', label: 'Картинка', type: 'image', hint: 'Лучше шириной от 1200px.' },
      { key: 'alt', label: 'Описание', type: 'text', hint: 'Что на картинке. Читают незрячие и поисковики.' },
      { key: 'caption', label: 'Подпись', type: 'text' },
    ],
  },
  media: {
    label: 'Картинка с текстом',
    defaults: { src: '', alt: '', imageSide: 'left', eyebrow: '', title: 'Заголовок', body: 'Текст рядом с картинкой.' },
    fields: [
      { key: 'src', label: 'Картинка', type: 'image' },
      { key: 'alt', label: 'Описание картинки', type: 'text' },
      { key: 'imageSide', label: 'Картинка', type: 'select', options: [
        { value: 'left', label: 'Слева' }, { value: 'right', label: 'Справа' } ] },
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea' },
    ],
  },
  quote: {
    label: 'Цитата',
    defaults: { text: 'Текст цитаты.', author: '' },
    fields: [
      { key: 'text', label: 'Цитата', type: 'textarea', hint: 'Кавычки добавятся сами.' },
      { key: 'author', label: 'Автор', type: 'text' },
    ],
  },
  cta: {
    label: 'Призыв с кнопкой',
    defaults: { title: 'Запишитесь на встречу', body: '', button: { label: 'Связаться со мной', href: '#contacts' } },
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea' },
      { key: 'button.label', label: 'Надпись на кнопке', type: 'text' },
      { key: 'button.href', label: 'Куда ведёт', type: 'target' },
    ],
  },
  spacer: {
    label: 'Отступ',
    defaults: { size: 'm' },
    fields: [
      { key: 'size', label: 'Высота', type: 'select', options: [
        { value: 's', label: 'Маленький' }, { value: 'm', label: 'Средний' }, { value: 'l', label: 'Большой' } ] },
    ],
  },
};

// Оформление целиком доступно у блоков с текстом. «Картинке» из него нужно
// только выравнивание: красить и укрупнять ей нечего, кроме подписи, и
// показывать ради этого четыре бесполезные ступени — обманывать. У «Отступа»
// нет и этого. У семи блоков страницы типографика — часть макета, а не контент.
const STYLED = ['text', 'media', 'quote', 'cta'];
const ALIGNABLE = ['image'];

// Выравнивание доступно и у блоков макета — но только там, где ему есть что
// двигать: заголовок с текстом рядом с картинкой или над карточками. У бегущей
// строки выравнивать нечего, она едет через весь экран.
const UNIQUE_ALIGN = { hero: 'left', cards: 'center', about: 'left', principles: 'center', education: 'left', contacts: 'center' };

export const SCHEMA = {
  ...Object.fromEntries(Object.entries(UNIQUE).map(([t, d]) => [t, {
    ...d,
    unique: true,
    fields: UNIQUE_ALIGN[t] ? [...d.fields, ALIGN_FIELD] : d.fields,
    defaults: UNIQUE_ALIGN[t] ? { ...(d.defaults || {}), style: { align: UNIQUE_ALIGN[t] } } : d.defaults,
  }])),
  ...Object.fromEntries(Object.entries(SIMPLE).map(([t, d]) => [t, {
    ...d,
    unique: false,
    fields: STYLED.includes(t) ? [...d.fields, ...STYLE_FIELDS]
      : ALIGNABLE.includes(t) ? [...d.fields, ALIGN_FIELD]
      : d.fields,
    defaults: STYLED.includes(t) ? { ...d.defaults, style: { ...STYLE_DEFAULTS, align: ALIGN_DEFAULTS[t] } }
      : ALIGNABLE.includes(t) ? { ...d.defaults, style: { align: ALIGN_DEFAULTS[t] } }
      : d.defaults,
  }])),
};

export const addableTypes = Object.keys(SIMPLE);

// --- сквозные части страницы -----------------------------------------------
// Меню одно на всю страницу: из него собираются и верхнее меню, и мобильная
// шторка, и подвал. Поэтому оно правится в одном месте, а не в трёх.
export const SITE_PARTS = {
  meta: {
    label: 'Сайт в поиске',
    at: 'meta',
    fields: [
      { key: 'title', label: 'Заголовок страницы', type: 'text',
        hint: 'Строка в результатах поиска и во вкладке браузера. Лучше до 60 знаков.' },
      { key: 'description', label: 'Описание для поиска', type: 'textarea',
        hint: 'Текст под заголовком в выдаче. Лучше 120–160 знаков: длиннее обрежут.' },
      { key: 'ogDescription', label: 'Подпись к ссылке', type: 'text',
        hint: 'Видна, когда ссылку кидают в телеграм или вотсап.' },
      { key: 'ogImage', label: 'Картинка к ссылке', type: 'image',
        hint: 'Показывается в мессенджерах. Лучше горизонтальная, от 1200×630.' },
      { key: 'siteUrl', label: 'Адрес сайта', type: 'text',
        hint: 'Полный адрес с https:// и косой чертой в конце. Менять только при переезде на свой домен.' },
    ],
    hint: 'Это не текст на странице, а то, как сайт выглядит в поиске и в пересланной ссылке.',
  },
  header: {
    label: 'Шапка',
    at: 'header',
    fields: [
      { key: 'name', label: 'Имя', type: 'text' },
      { key: 'role', label: 'Подпись под именем', type: 'text' },
      { key: 'avatar', label: 'Фото в кружке', type: 'image' },
      { key: 'cta.label', label: 'Надпись на кнопке', type: 'text' },
      { key: 'cta.href', label: 'Куда ведёт кнопка', type: 'target' },
    ],
  },
  nav: {
    label: 'Меню',
    at: 'nav',
    asList: { key: '', label: 'Пункты меню', type: 'list', itemLabel: 'Пункт', of: [
      { key: 'label', label: 'Название', type: 'text' },
      { key: 'href', label: 'Куда ведёт', type: 'target' },
    ] },
    hint: 'Эти пункты выводятся и в шапке, и в меню-гамбургере на телефоне, и в подвале. «Куда ведёт» — выбор блока на этой же странице: нажатие прокручивает к нему.',
  },
  footer: {
    label: 'Подвал',
    at: 'footer',
    fields: [
      { key: 'name', label: 'Имя', type: 'text' },
      { key: 'role', label: 'Подпись под именем', type: 'text' },
      { key: 'copyright', label: 'Строка об авторстве', type: 'text' },
      { key: 'policyLabel', label: 'Название ссылки на политику', type: 'text' },
      { key: 'policyHref', label: 'Ссылка на политику', type: 'link' },
    ],
  },
};

// доступ к вложенным полям по ключу с точкой: 'button.label'
export const getAt = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
export function setAt(obj, key, value) {
  const parts = key.split('.');
  const last = parts.pop();
  const target = parts.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
  return obj;
}
