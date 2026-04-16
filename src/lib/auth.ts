import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

function getSecret(): string {
  const secret = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

// JWT carries only the user ID — it is a session pointer, not a claims token.
// Actual user data is always fetched from the database in the middleware.
export interface SessionPayload {
  sub: string; // MongoDB user _id
}

export function signToken(userId: string): string {
  const payload: SessionPayload = { sub: userId };
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload {
  return jwt.verify(token, getSecret()) as SessionPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}

export function makeAuthCookie(token: string): string {
  return `auth_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function makeClearCookie(): string {
  return `auth_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
