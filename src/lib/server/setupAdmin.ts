import crypto from 'crypto';
import { saveUser } from './db.js';

// Run: npx tsx src/lib/server/setupAdmin.ts
// Or set via env: ADMIN_EMAIL=admin@example.com, ADMIN_PASSWORD=secret123

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const callSign = 'ADMIN';

if (!email || !password) {
  console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to create admin user.');
  process.exit(0);
}

const userId = crypto.randomUUID();
const salt = crypto.randomBytes(16).toString('hex');
const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');

saveUser({
  id: userId,
  email,
  passwordHash,
  salt,
  googleId: null,
  callSign: callSign,
  isAdmin: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}).then(() => {
  console.log(`Admin user created: ${email} (id: ${userId})`);
  process.exit(0);
});
