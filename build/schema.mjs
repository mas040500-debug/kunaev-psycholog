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
      { key: 'cta.href', label: 'Куда ведёт кнопка', type: 'link' },
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
          { value: 'whatsapp', label: 'WhatsApp' } ] },
        { key: 'label', label: 'Название', type: 'text' },
        { key: 'value', label: 'Что показывать', type: 'text' },
        { key: 'href', label: 'Ссылка', type: 'link',
          hint: 'tel:+7… для телефона, https://t.me/… и https://wa.me/… для мессенджеров.' },
      ] },
    ],
  },
};

// --- простые блоки: их можно добавлять сколько угодно и куда угодно ---------
export const SIMPLE = {
  text: {
    label: 'Заголовок с текстом',
    defaults: { eyebrow: '', title: 'Заголовок', body: 'Текст блока.', align: 'left' },
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text', hint: 'Можно оставить пустым.' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea', hint: 'Пустая строка разделяет абзацы.' },
      { key: 'align', label: 'Выравнивание', type: 'select', options: [
        { value: 'left', label: 'По левому краю' }, { value: 'center', label: 'По центру' } ] },
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
      { key: 'button.href', label: 'Куда ведёт', type: 'link', hint: 'Например #contacts или https://t.me/…' },
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

export const SCHEMA = {
  ...Object.fromEntries(Object.entries(UNIQUE).map(([t, d]) => [t, { ...d, unique: true }])),
  ...Object.fromEntries(Object.entries(SIMPLE).map(([t, d]) => [t, { ...d, unique: false }])),
};

export const addableTypes = Object.keys(SIMPLE);

// доступ к вложенным полям по ключу с точкой: 'button.label'
export const getAt = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
export function setAt(obj, key, value) {
  const parts = key.split('.');
  const last = parts.pop();
  const target = parts.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
  return obj;
}
