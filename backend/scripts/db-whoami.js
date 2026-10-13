// Imprime a qué base de datos apunta este entorno (dev o producción), con el
// password enmascarado. Pensado para correrlo ANTES de cualquier comando de
// base que pueda ser destructivo (migrate dev, reset, db push, shadow, etc.).
// Uso: npm run db:whoami
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ No existe backend/.env');
  process.exit(1);
}
const env = fs.readFileSync(envPath, 'utf8');

function readVar(name) {
  const m = env.match(new RegExp(`^${name}\\s*=\\s*"?([^"\\r\\n]+)"?`, 'm'));
  return m ? m[1].trim() : null;
}

function describe(name) {
  const url = readVar(name);
  if (!url) return `  ${name}: (no definido)`;

  const masked = url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
  const parts = url.match(/^[a-z]+:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)/);
  const host = parts ? parts[3] : '(no parseable)';
  const port = parts ? parts[4] : '?';

  let mode = 'desconocido';
  if (url.includes('pooler.supabase.com')) {
    if (port === '6543') mode = 'Supabase · transaction pooler (app)';
    else if (port === '5432') mode = 'Supabase · session pooler (migraciones)';
  } else if (host === 'localhost' || host === '127.0.0.1') {
    mode = 'local';
  }

  return `  ${name}:\n    ${masked}\n    -> host=${host} puerto=${port} | ${mode}`;
}

console.log('Base de datos a la que apunta backend/.env:\n');
console.log(describe('DATABASE_URL'));
console.log(describe('DIRECT_URL'));
console.log(
  '\n⚠️  Confirmá que es la base que esperás antes de correr migraciones o cualquier comando destructivo.',
);
