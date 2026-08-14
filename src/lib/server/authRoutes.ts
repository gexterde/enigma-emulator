import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import path from 'path';
import AdmZip from 'adm-zip';
import multer from 'multer';
import fs from 'fs/promises';
import { getUserByEmail, getUserById, getUserByCallSign, saveUser, getUserState, saveUserState, getEmailIndex, DATA_DIR, INDEX_FILE } from './db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-key-for-local-testing');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  console.warn('GOOGLE_CLIENT_ID not set — Google auth disabled');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Simple rate limiter
const loginAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  let attempts = loginAttempts.get(ip) || [];
  
  // Filter out old attempts
  attempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (attempts.length >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts, please try again later' });
  }
  
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  next();
};

// POST /api/auth/register
router.post('/register', rateLimitMiddleware, async (req: any, res: any) => {
  try {
    let { email, password, callSign } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password too short' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    if (callSign) {
      callSign = callSign.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
      const existingCallSign = await getUserByCallSign(callSign);
      if (existingCallSign) {
        return res.status(409).json({ error: 'Call sign already in use' });
      }
    }


    const userId = uuidv4();
    const now = new Date().toISOString();
    
    // Server-side salt and hash derivation using PBKDF2
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');

    await saveUser({
      id: userId,
      email,
      passwordHash,
      salt,
      googleId: null,
      callSign: callSign || null,
      isAdmin: false,
      createdAt: now,
      updatedAt: now
    });

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'User registered successfully', user: { id: userId, email, isAdmin: false, callSign: callSign || null } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', rateLimitMiddleware, async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    let user = await getUserByEmail(email);
    if (!user) {
      user = await getUserByCallSign(email.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5));
    }
    if (!user || !user.salt || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Derive key
    const derivedHashHex = crypto.pbkdf2Sync(password, user.salt, 100000, 32, 'sha256').toString('hex');
    const storedHashBuffer = Buffer.from(user.passwordHash, 'hex');
    const derivedHashBuffer = Buffer.from(derivedHashHex, 'hex');

    if (storedHashBuffer.length !== derivedHashBuffer.length || !crypto.timingSafeEqual(storedHashBuffer, derivedHashBuffer)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, email: user.email, isAdmin: user.isAdmin, callSign: user.callSign } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google
router.post('/google', rateLimitMiddleware, async (req: any, res: any) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Google sign-in is not configured' });
    }

    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid token payload' });

    let user = await getUserByEmail(payload.email);
    if (!user) {
      user = {
        id: uuidv4(),
        email: payload.email,
        passwordHash: null,
        salt: null,
        googleId: payload.sub,
        callSign: null,
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveUser(user);
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await saveUser(user);
    }

    const jwtToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, email: user.email, isAdmin: user.isAdmin, callSign: user.callSign } });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});


// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out' });
});

// Middleware for auth
export const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserById((decoded as any).userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

export const requireAdmin = async (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserById((decoded as any).userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /api/auth/me
router.get('/me', requireAuth, async (req: any, res: any) => {
  const user = await getUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, email: user.email, isAdmin: user.isAdmin, callSign: user.callSign } });
});

// GET /api/user/state
router.get('/user/state', requireAuth, async (req: any, res: any) => {
  const state = await getUserState(req.user.userId);
  if (!state) return res.status(404).json({ error: 'No state found' });
  res.json(state);
});

// PUT /api/user/state
router.put('/user/state', requireAuth, async (req: any, res: any) => {
  const state = req.body;
  await saveUserState(req.user.userId, state);
  res.json({ success: true });
});

// GET /api/auth/admin/export
router.get('/admin/export', requireAdmin, (req: any, res: any) => {
  try {
    const zip = new AdmZip();
    const dataDir = path.join(process.cwd(), 'data', 'users');
    
    // Add entire data/users directory to ZIP
    zip.addLocalFolder(dataDir, 'data/users');
    
    const buffer = zip.toBuffer();
    const date = new Date().toISOString().split('T')[0];
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="enigma-backup-${date}.zip"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/auth/admin/import
router.post('/admin/import', requireAdmin, upload.single('backup'), async (req: any, res: any) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No backup file provided' });
    }
    const zip = new AdmZip(req.file.buffer);
    const dataDir = path.join(process.cwd(), 'data', 'users');
    
    // Validate: no directory traversal
    zip.getEntries().forEach((entry) => {
      if (entry.entryName.includes('..')) {
        throw new Error('Invalid ZIP: directory traversal detected');
      }
    });
    
    // Extract to data/users/
    zip.extractAllTo(dataDir, true);
    
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(400).json({ error: error.message || 'Failed to restore backup' });
  }
});

// GET /api/auth/admin/users
router.get('/admin/users', requireAdmin, async (req: any, res: any) => {
  try {
    const index = await getEmailIndex();
    const users = await Promise.all(
      Object.values(index).map(id => getUserById(id).then(u => u && {
        id: u.id,
        email: u.email,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
      }))
    );
    res.json({ users: users.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// DELETE /api/auth/admin/users/:userId
router.delete('/admin/users/:userId', requireAdmin, async (req: any, res: any) => {
  try {
    const userId = req.params.userId;
    const userDir = path.join(DATA_DIR, userId);
    
    // Delete user file
    await fs.unlink(path.join(DATA_DIR, `${userId}.json`));
    
    // Delete user state directory
    await fs.rm(userDir, { recursive: true, force: true });
    
    // Remove from email index
    const index = await getEmailIndex();
    // Find email for this user
    for (const [email, uid] of Object.entries(index)) {
      if (uid === userId) {
        delete index[email];
        break;
      }
    }
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));
    
    res.json({ success: true, message: 'User removed' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});


// PUT /api/auth/callsign
router.put('/callsign', requireAuth, async (req: any, res: any) => {
  try {
    let { callSign } = req.body;
    if (!callSign) return res.status(400).json({ error: 'Missing callSign' });
    callSign = callSign.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    
    // Check if unique
    const existing = await getUserByCallSign(callSign);
    if (existing && existing.id !== req.user.userId) {
      return res.status(409).json({ error: 'Call sign already taken' });
    }
    
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.callSign = callSign;
    await saveUser(user);
    
    res.json({ success: true, callSign });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const RADIO_SETTINGS_FILE = path.join(process.cwd(), 'data', 'radio_settings.json');

// GET /api/radio/settings or /api/auth/radio/settings
router.get('/radio/settings', async (req: any, res: any) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.userId) {
          const userState = await getUserState(decoded.userId);
          if (userState && userState.radio_state) {
            const parsed = typeof userState.radio_state === 'string' 
              ? JSON.parse(userState.radio_state) 
              : userState.radio_state;
            return res.json({ settings: parsed });
          }
        }
      } catch (e) {}
    }

    try {
      const data = await fs.readFile(RADIO_SETTINGS_FILE, 'utf-8');
      return res.json({ settings: JSON.parse(data) });
    } catch {
      return res.json({ settings: null });
    }
  } catch (error) {
    console.error('Error reading radio settings:', error);
    res.status(500).json({ error: 'Failed to read radio settings' });
  }
});

// POST /api/radio/settings
router.post('/radio/settings', async (req: any, res: any) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'Missing settings' });
    }

    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.userId) {
          const userState = (await getUserState(decoded.userId)) || {};
          userState.radio_state = typeof settings === 'string' ? settings : JSON.stringify(settings);
          await saveUserState(decoded.userId, userState);
          return res.json({ success: true, settings });
        }
      } catch (e) {}
    }

    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}
    await fs.writeFile(RADIO_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving radio settings:', error);
    res.status(500).json({ error: 'Failed to save radio settings' });
  }
});

// PUT /api/radio/settings
router.put('/radio/settings', async (req: any, res: any) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'Missing settings' });
    }

    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.userId) {
          const userState = (await getUserState(decoded.userId)) || {};
          userState.radio_state = typeof settings === 'string' ? settings : JSON.stringify(settings);
          await saveUserState(decoded.userId, userState);
          return res.json({ success: true, settings });
        }
      } catch (e) {}
    }

    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch {}
    await fs.writeFile(RADIO_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating radio settings:', error);
    res.status(500).json({ error: 'Failed to update radio settings' });
  }
});

export default router;
