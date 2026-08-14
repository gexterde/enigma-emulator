import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'users');
const INDEX_FILE = path.join(DATA_DIR, '_email_index.json');

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  salt: string | null;
  googleId: string | null;
  callSign: string | null;
  createdAt: string;
  updatedAt: string;
}

// Simple in-memory mutex for file operations
const locks = new Map<string, Promise<void>>();

async function acquireLock(key: string): Promise<() => void> {
  while (locks.has(key)) {
    await locks.get(key);
  }
  let release: () => void;
  const promise = new Promise<void>((resolve) => {
    release = () => {
      locks.delete(key);
      resolve();
    };
  });
  locks.set(key, promise);
  return release!;
}

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function getEmailIndex(): Promise<Record<string, string>> {
  try {
    const data = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function updateEmailIndex(email: string, userId: string) {
  const release = await acquireLock('_email_index');
  try {
    await ensureDir(DATA_DIR);
    const index = await getEmailIndex();
    index[email] = userId;
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  } finally {
    release();
  }
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as UserRecord;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    const index = await getEmailIndex();
    const userId = index[email];
    if (userId) {
      return await getUserById(userId);
    }
    
    // Fallback: If index is missing or out of sync, scan files and rebuild
    const release = await acquireLock('_email_index_rebuild');
    try {
      await ensureDir(DATA_DIR);
      const files = await fs.readdir(DATA_DIR);
      const newIndex: Record<string, string> = {};
      let foundUser: UserRecord | null = null;
      
      for (const file of files) {
        if (file.endsWith('.json') && file !== '_email_index.json') {
          try {
            const filePath = path.join(DATA_DIR, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const user = JSON.parse(data) as UserRecord;
            newIndex[user.email] = user.id;
            if (user.email === email) {
              foundUser = user;
            }
          } catch (e) {
            // Ignore corrupted files
          }
        }
      }
      
      // Save rebuilt index
      await fs.writeFile(INDEX_FILE, JSON.stringify(newIndex, null, 2), 'utf-8');
      return foundUser;
    } finally {
      release();
    }
  } catch (error) {
    console.error("Error reading users", error);
    return null;
  }
}

export async function saveUser(user: UserRecord): Promise<void> {
  const release = await acquireLock(user.id);
  try {
    await ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, `${user.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
    
    // Update index without waiting for it to finish the outer lock
    await updateEmailIndex(user.email, user.id);
  } finally {
    release();
  }
}

export async function getUserState(userId: string): Promise<Record<string, string> | null> {
  try {
    const filePath = path.join(DATA_DIR, userId, 'state.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveUserState(userId: string, state: Record<string, string>): Promise<void> {
  const release = await acquireLock(`state_${userId}`);
  try {
    const userDir = path.join(DATA_DIR, userId);
    await ensureDir(userDir);
    const filePath = path.join(userDir, 'state.json');
    await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } finally {
    release();
  }
}
