const fs = require('fs');

let db = fs.readFileSync('src/lib/server/db.ts', 'utf-8');

const newFn = `
export async function getUserByCallSign(callSign: string): Promise<UserRecord | null> {
  try {
    const release = await acquireLock('_read_all_users');
    try {
      await ensureDir(DATA_DIR);
      const files = await fs.readdir(DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('_')) {
          try {
            const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
            const user = JSON.parse(data) as UserRecord;
            if (user.callSign && user.callSign.toUpperCase() === callSign.toUpperCase()) {
              return user;
            }
          } catch (e) {}
        }
      }
      return null;
    } finally {
      release();
    }
  } catch (error) {
    return null;
  }
}
`;

if (!db.includes('getUserByCallSign')) {
  db += '\n' + newFn;
  fs.writeFileSync('src/lib/server/db.ts', db);
  console.log('patched db.ts');
} else {
  console.log('already patched');
}
