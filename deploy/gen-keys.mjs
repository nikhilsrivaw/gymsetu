// Generate Supabase self-host ANON_KEY and SERVICE_ROLE_KEY from your JWT_SECRET.
// Pure Node (no deps). Run on your PC or the server:
//
//   node gen-keys.mjs "<your JWT_SECRET (>=32 chars)>"
//
// Paste the two printed lines into supabase/docker/.env
import crypto from 'node:crypto';

const secret = process.argv[2] || process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  console.error('ERROR: pass your JWT_SECRET (>=32 chars).');
  console.error('Usage: node gen-keys.mjs "<JWT_SECRET>"');
  process.exit(1);
}

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function sign(payload) {
  const head = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url(payload);
  const data = `${head}.${body}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60 * 60 * 24 * 365 * 10; // 10 years

console.log('ANON_KEY=' + sign({ role: 'anon', iss: 'supabase', iat, exp }));
console.log('SERVICE_ROLE_KEY=' + sign({ role: 'service_role', iss: 'supabase', iat, exp }));
console.log('\n# Paste both lines above into supabase/docker/.env');
console.log('# ANON_KEY also goes into app/.env as EXPO_PUBLIC_SUPABASE_ANON_KEY');
