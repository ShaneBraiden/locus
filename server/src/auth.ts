import type express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRepos } from './db.js';

// JWT auth over MongoDB-backed users. Replaces the old Firebase Admin flow.
// The literal token "local_guest_token" still grants a sandboxed guest session
// in dev so the app is usable without registering.

const TOKEN_TTL = '30d';

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  isGuest: boolean;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set (>=16 chars) in production');
  }
  return 'northr-dev-secret-change-me-in-production';
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: TOKEN_TTL });
}

const guestAllowed = () =>
  process.env.ALLOW_GUEST === 'true' || process.env.NODE_ENV !== 'production';

export const GUEST: AuthUser = {
  id: 'guest_user_local',
  name: 'Guest Student',
  email: null,
  isGuest: true,
};

/**
 * Resolves a bare token to a user, or null.
 *
 * Split out of `requireAuth` so the one route that cannot use a header — the
 * `sendBeacon` state write on tab close — validates the token through exactly
 * the same code path rather than a second, subtly different copy of it.
 */
export async function userForToken(token: string): Promise<AuthUser | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed === 'local_guest_token') return guestAllowed() ? GUEST : null;

  try {
    const payload = jwt.verify(trimmed, secret()) as { sub?: string };
    const user = payload.sub ? await getRepos().users.findById(payload.sub) : null;
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, isGuest: false };
  } catch {
    return null;
  }
}

export const requireAuth: express.RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization' });
    return;
  }

  const user = await userForToken(header.slice('Bearer '.length));
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session, please sign in again' });
    return;
  }
  (req as any).user = user;
  next();
};

export function currentUser(req: express.Request): AuthUser {
  return (req as any).user as AuthUser;
}

// ---- Route handlers ----

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerHandler: express.RequestHandler = async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (name.length < 2 || name.length > 60) {
    res.status(400).json({ error: 'Please enter your name (2-60 characters)' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'That email address does not look right' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const repos = getRepos();
  if (await repos.users.findByEmail(email)) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await repos.users.create({ name, email, passwordHash });
  res.status(201).json({
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
};

export const loginHandler: express.RequestHandler = async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await getRepos().users.findByEmail(email);
  // Constant-ish time: always run a compare so timing does not leak existence
  const ok = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu');

  if (!user || !ok) {
    res.status(401).json({ error: 'Incorrect email or password' });
    return;
  }

  res.json({
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
};

export const meHandler: express.RequestHandler = (req, res) => {
  const u = currentUser(req);
  res.json({ user: { id: u.id, name: u.name, email: u.email, isGuest: u.isGuest } });
};
