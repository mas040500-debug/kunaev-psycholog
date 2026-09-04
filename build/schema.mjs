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
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'title', label: 'Заголовок', type: 'rich',
        hint: 'Одна фраза. На сколько строк она ляжет, решает ширина экрана. Выделите кусок и задайте ему цвет, размер или шрифт.' },
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
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'cards', label: 'Карточки', type: 'list', itemLabel: 'Карточка', of: [
        { key: 'title', label: 'Название', type: 'rich' },
        { key: 'items', label: 'Пункты', type: 'lines' },
      ] },
    ],
  },

  about: {
    label: 'Обо мне',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'watermark', label: 'Слово за фотографией', type: 'text' },
      { key: 'photo.src', label: 'Фотография', type: 'image' },
      { key: 'photo.alt', label: 'Описание фотографии', type: 'text' },
      { key: 'lead', label: 'Крупная фраза', type: 'rich' },
      { key: 'body', label: 'Текст', type: 'rich' },
      { key: 'tags', label: 'Строка через дробь', type: 'rich' },
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
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'sub', label: 'Подзаголовок', type: 'rich' },
      { key: 'notes', label: 'Записки', type: 'list', itemLabel: 'Записка', max: 3, of: [
        { key: 'title', label: 'Название', type: 'rich' },
        { key: 'text', label: 'Текст', type: 'rich' },
      ] },
    ],
  },

  education: {
    label: 'Образование',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'body', label: 'Текст', type: 'rich' },
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
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'sub', label: 'Подзаголовок', type: 'rich' },
      { key: 'items', label: 'Способы связи', type: 'list', itemLabel: 'Способ', of: [
        { key: 'icon', label: 'Значок', type: 'select', options: [
          { value: 'phone', label: 'Телефон' },
          { value: 'telegram', label: 'Telegram' },
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'mail', label: 'Почта' },
          { value: 'vk', label: 'ВКонтакте' },
          { value: 'site', label: 'Другая ссылка' } ] },
        { key: 'label', label: 'Название', type: 'rich' },
        { key: 'value', label: 'Что показывать', type: 'rich' },
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
// Отступы внутри блока — отдельно для трёх экранов. Одного значения мало:
// то, что на десктопе выглядит воздушно, на телефоне часто разрежено, и
// наоборот. Ступени, а не пиксели: меняется плотность блока целиком,
// пропорции внутри него остаются от дизайна.
const GAP_OPTIONS = [
  { value: 'xs', label: 'Очень плотно' },
  { value: 's', label: 'Плотно' },
  { value: 'm', label: 'Обычно' },
  { value: 'l', label: 'Просторно' },
  { value: 'xl', label: 'Очень просторно' },
];

const GAP_OPTIONS_TEXT = [
  { value: 'xs', label: 'Сильно мельче' },
  { value: 's', label: 'Мельче' },
  { value: 'm', label: 'Обычный' },
  { value: 'l', label: 'Крупнее' },
  { value: 'xl', label: 'Сильно крупнее' },
];

export const SPACE_FIELDS = [
  { key: 'space.desktop', label: 'Отступы: компьютер', type: 'select', options: GAP_OPTIONS, default: 'm' },
  { key: 'space.tablet', label: 'Отступы: планшет', type: 'select', options: GAP_OPTIONS, default: 'm' },
  { key: 'space.mobile', label: 'Отступы: телефон', type: 'select', options: GAP_OPTIONS, default: 'm',
    hint: 'Расстояния между элементами внутри блока. У каждого экрана своё значение — проверяйте кнопками «Компьютер / Планшет / Телефон» справа.' },
];

export const TEXT_SIZE_FIELDS = [
  { key: 'textSize.desktop', label: 'Размер текста: компьютер', type: 'select', options: GAP_OPTIONS_TEXT, default: 'm' },
  { key: 'textSize.tablet', label: 'Размер текста: планшет', type: 'select', options: GAP_OPTIONS_TEXT, default: 'm' },
  { key: 'textSize.mobile', label: 'Размер текста: телефон', type: 'select', options: GAP_OPTIONS_TEXT, default: 'm',
    hint: 'Масштаб всей типографики блока: заголовок и текст меняются вместе, их соотношение остаётся от дизайна.' },
];

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
  { key: 'style.weight', label: 'Начертание', type: 'select', options: [
    { value: 'normal', label: 'Обычное' },
    { value: 'bold', label: 'Жирный текст' },
    { value: 'light', label: 'Лёгкий заголовок' } ],
    hint: 'Жирный — для текста, лёгкий — для заголовка. Оба сразу делать не стоит: пропадёт разница между ними.' },
  ALIGN_FIELD,
];

const STYLE_DEFAULTS = { color: 'default', font: 'base', size: 'm', gap: 'm', weight: 'normal' };

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
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich', hint: 'Можно оставить пустым.' },
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'body', label: 'Текст', type: 'rich', hint: 'Пустая строка разделяет абзацы.' },
    ],
  },
  image: {
    label: 'Картинка',
    defaults: { src: '', alt: '', caption: '' },
    fields: [
      { key: 'src', label: 'Картинка', type: 'image', hint: 'Лучше шириной от 1200px.' },
      { key: 'alt', label: 'Описание', type: 'text', hint: 'Что на картинке. Читают незрячие и поисковики.' },
      { key: 'caption', label: 'Подпись', type: 'rich' },
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
      { key: 'eyebrow', label: 'Надзаголовок', type: 'rich' },
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'body', label: 'Текст', type: 'rich' },
    ],
  },
  quote: {
    label: 'Цитата',
    defaults: { text: 'Текст цитаты.', author: '' },
    fields: [
      { key: 'text', label: 'Цитата', type: 'rich', hint: 'Кавычки добавятся сами.' },
      { key: 'author', label: 'Автор', type: 'rich' },
    ],
  },
  cta: {
    label: 'Призыв с кнопкой',
    defaults: { title: 'Запишитесь на встречу', body: '', button: { label: 'Связаться со мной', href: '#contacts' } },
    fields: [
      { key: 'title', label: 'Заголовок', type: 'rich' },
      { key: 'body', label: 'Текст', type: 'rich' },
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

const SPACE_DEFAULTS = { desktop: 'm', tablet: 'm', mobile: 'm' };
const TEXT_DEFAULTS = { desktop: 'm', tablet: 'm', mobile: 'm' };

export const SCHEMA = {
  ...Object.fromEntries(Object.entries(UNIQUE).map(([t, d]) => [t, {
    ...d,
    unique: true,
    fields: [...(UNIQUE_ALIGN[t] ? [...d.fields, ALIGN_FIELD] : d.fields), ...SPACE_FIELDS, ...TEXT_SIZE_FIELDS],
    defaults: UNIQUE_ALIGN[t] ? { ...(d.defaults || {}), style: { align: UNIQUE_ALIGN[t] } } : d.defaults,
  }])),
  ...Object.fromEntries(Object.entries(SIMPLE).map(([t, d]) => [t, {
    ...d,
    unique: false,
    fields: [
      ...(STYLED.includes(t) ? [...d.fields, ...STYLE_FIELDS]
        : ALIGNABLE.includes(t) ? [...d.fields, ALIGN_FIELD]
        : d.fields),
      ...SPACE_FIELDS, ...TEXT_SIZE_FIELDS,
    ],
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
      { key: 'name', label: 'Имя', type: 'rich' },
      { key: 'role', label: 'Подпись под именем', type: 'rich' },
      { key: 'avatar', label: 'Фото в кружке', type: 'image' },
      { key: 'cta.label', label: 'Надпись на кнопке', type: 'text' },
      { key: 'cta.href', label: 'Куда ведёт кнопка', type: 'target' },
      { key: 'floatingContact', label: 'Круглая кнопка на телефоне', type: 'select', options: [
        { value: 'on', label: 'Показывать' },
        { value: 'off', label: 'Не показывать' } ],
        hint: 'Всегда на виду в углу экрана, ведёт туда же, куда кнопка выше. Только на телефоне: на компьютере кнопка есть в шапке.' },
    ],
  },
  nav: {
    label: 'Меню',
    at: 'nav',
    asList: { key: '', label: 'Пункты меню', type: 'list', itemLabel: 'Пункт', of: [
      { key: 'label', label: 'Название', type: 'rich' },
      { key: 'href', label: 'Куда ведёт', type: 'target' },
    ] },
    hint: 'Эти пункты выводятся и в шапке, и в меню-гамбургере на телефоне, и в подвале. «Куда ведёт» — выбор блока на этой же странице: нажатие прокручивает к нему.',
  },
  footer: {
    label: 'Подвал',
    at: 'footer',
    fields: [
      { key: 'name', label: 'Имя', type: 'rich' },
      { key: 'role', label: 'Подпись под именем', type: 'rich' },
      { key: 'copyright', label: 'Строка об авторстве', type: 'rich' },
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
