import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
