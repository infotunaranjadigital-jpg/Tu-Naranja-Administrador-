import { cookies } from 'next/headers';
import { getDb } from './db';
import crypto from 'node:crypto';

export interface UserSession {
  id: string;
  username: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_token')?.value;

  if (!sessionToken) return null;

  try {
    const [userId] = Buffer.from(sessionToken, 'base64').toString().split(':');
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?');
    const user = stmt.get(userId) as UserSession | undefined;
    return user || null;
  } catch {
    return null;
  }
}

export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;
  const db = getDb();
  const stmt = db.prepare('SELECT id FROM api_keys WHERE key = ?');
  const result = stmt.get(apiKey);
  return !!result;
}
