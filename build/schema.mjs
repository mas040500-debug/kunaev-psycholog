// Описание блоков: какие бывают и какие у них поля.
//
// Это контракт между контентом, шаблонами и будущей админкой. Админка
// построит формы по этому файлу, а не по захардкоженной разметке — иначе
// добавление блока означало бы правку в трёх местах.
//
// Поля:
//   key    — имя в data
//   label  — подпись в форме
//   type   — text | textarea | image | link | list | select | number
//   hint   — пояснение под полем
//   of     — для list: описание полей одного элемента

export const BACKGROUNDS = [
  { value: 'surface', label: 'Белый' },
  { value: 'second-soft', label: 'Сиреневый' },
  { value: 'page', label: 'Светло-голубой' },
];

// Блоки страницы — по одному экземпляру, их состав задан дизайном.
// Владелец сайта правит в них тексты и картинки, может скрыть или
// переставить, но не может добавить второй такой же.
const UNIQUE = {
  hero: 'Первый экран',
  cards: 'Направления',
  about: 'Обо мне',
  marquee: 'Бегущая строка',
  principles: 'Принципы работы',
  education: 'Образование',
  contacts: 'Контакты',
};

// Простые блоки — их можно добавлять сколько угодно и в любом месте.
export const SIMPLE = {
  text: {
    label: 'Заголовок с текстом',
    fields: [
      { key: 'eyebrow', label: 'Надзаголовок', type: 'text', hint: 'Мелкая строка над заголовком. Можно оставить пустой.' },
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea', hint: 'Пустая строка разделяет абзацы.' },
      { key: 'align', label: 'Выравнивание', type: 'select', options: [
        { value: 'left', label: 'По левому краю' }, { value: 'center', label: 'По центру' } ] },
    ],
  },
  image: {
    label: 'Картинка',
    fields: [
      { key: 'src', label: 'Картинка', type: 'image', hint: 'Лучше шириной от 1200px — она растянется на всю колонку.' },
      { key: 'alt', label: 'Описание', type: 'text', hint: 'Что на картинке. Читают незрячие и поисковики.' },
      { key: 'caption', label: 'Подпись', type: 'text' },
    ],
  },
  media: {
    label: 'Картинка с текстом',
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
    fields: [
      { key: 'text', label: 'Цитата', type: 'textarea', hint: 'Кавычки добавятся сами.' },
      { key: 'author', label: 'Автор', type: 'text' },
    ],
  },
  cta: {
    label: 'Призыв с кнопкой',
    fields: [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'body', label: 'Текст', type: 'textarea' },
      { key: 'button.label', label: 'Надпись на кнопке', type: 'text' },
      { key: 'button.href', label: 'Куда ведёт', type: 'link', hint: 'Например #contacts или https://t.me/…' },
    ],
  },
  spacer: {
    label: 'Отступ',
    fields: [
      { key: 'size', label: 'Высота', type: 'select', options: [
        { value: 's', label: 'Маленький' }, { value: 'm', label: 'Средний' }, { value: 'l', label: 'Большой' } ] },
    ],
  },
};

export const SCHEMA = {
  ...Object.fromEntries(Object.entries(UNIQUE).map(([type, label]) => [type, { label, unique: true }])),
  ...Object.fromEntries(Object.entries(SIMPLE).map(([type, def]) => [type, { ...def, unique: false }])),
};

export const addableTypes = Object.keys(SIMPLE);
