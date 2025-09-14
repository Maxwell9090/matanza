import bcrypt from 'bcryptjs';

const pwd = process.argv[2];
if (!pwd) {
  console.error('Uso: npm run hash -- \"SUA_SENHA_AQUI\"');
  process.exit(1);
}
const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(pwd, salt);
console.log('Hash bcrypt:\n', hash);