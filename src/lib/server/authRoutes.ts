import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { getUserByEmail, getUserById, saveUser, getUserState, saveUserState } from './db.js';

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
    const { email, password } = req.body;
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
      callSign: null,
      createdAt: now,
      updatedAt: now
    });

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'User registered successfully', user: { id: userId, email } });
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

    const user = await getUserByEmail(email);
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, email: user.email } });
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Middleware for auth
export const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
  res.json({ user: { id: user.id, email: user.email } });
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

export default router;
