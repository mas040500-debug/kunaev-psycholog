// Готовит запись о пользователе для секрета AUTH_USERS.
//
// Пароль нигде не сохраняется — ни в файл, ни в репозиторий. Считается только
// его отпечаток (PBKDF2 с солью), по которому пароль обратно не восстановить.
//
//   node worker/make-user.mjs psy@example.com 'придуманный-пароль'
//
// Вывод целиком скармливается воркеру:
//   npx wrangler secret put AUTH_USERS

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Как пользоваться:\n  node worker/make-user.mjs почта@пример.рф \'пароль\'\n');
  process.exit(1);
}
if (password.length < 12) {
  console.error(`Пароль короче 12 символов (сейчас ${password.length}).`);
  console.error('Это единственный замок на админке — возьмите длиннее, лучше несколько слов.');
  process.exit(1);
}

const enc = new TextEncoder();
const b64 = (buf) => Buffer.from(new Uint8Array(buf)).toString('base64');

const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, key, 256);

const user = { email, salt: b64(salt), hash: b64(bits), iterations: 210000 };

console.log('\nЗапись о пользователе — добавьте её в список AUTH_USERS:\n');
console.log(JSON.stringify([user], null, 2));
console.log('\nЕсли пользователей несколько, положите их в один массив.');
console.log('Затем:  npx wrangler secret put AUTH_USERS   и вставьте массив целиком.\n');
