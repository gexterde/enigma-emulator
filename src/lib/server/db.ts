import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'users');

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

export interface EncryptedState {
  salt: string;
  nonce: string;
  ciphertext: string;
}

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
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
    await ensureDir(DATA_DIR);
    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const user = JSON.parse(data) as UserRecord;
        if (user.email === email) {
          return user;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error reading users", error);
    return null;
  }
}

export async function saveUser(user: UserRecord): Promise<void> {
  await ensureDir(DATA_DIR);
  const filePath = path.join(DATA_DIR, `${user.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
}

export async function getUserState(userId: string): Promise<EncryptedState | null> {
  try {
    const filePath = path.join(DATA_DIR, userId, 'state.enc');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as EncryptedState;
  } catch {
    return null;
  }
}

export async function saveUserState(userId: string, state: EncryptedState): Promise<void> {
  const userDir = path.join(DATA_DIR, userId);
  await ensureDir(userDir);
  const filePath = path.join(userDir, 'state.enc');
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
}
