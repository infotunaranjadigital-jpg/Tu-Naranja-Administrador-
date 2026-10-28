import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function POST(req: Request) {
  try {
    seedDatabase(); // ensure initialized
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const db = getDb();
    const hash = hashPassword(password);
    const stmt = db.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password_hash = ?');
    const user = stmt.get(username.trim().toLowerCase(), hash) as any;

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const tokenPayload = `${user.id}:${Date.now()}`;
    const token = Buffer.from(tokenPayload).toString('base64');

    const res = NextResponse.json({ success: true, user });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
