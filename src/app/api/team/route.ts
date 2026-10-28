import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  const db = getDb();

  const members = db.prepare(`
    SELECT 
      m.*,
      (SELECT COUNT(*) FROM team_payments WHERE member_id = m.id) as payments_count,
      (SELECT SUM(amount) FROM team_payments WHERE member_id = m.id AND strftime('%Y', date) = strftime('%Y', 'now')) as annual_paid
    FROM team_members m
    ORDER BY m.name ASC
  `).all();

  const recentPayments = db.prepare(`
    SELECT p.*, m.name as member_name, m.payment_method as preferred_payment_method
    FROM team_payments p
    JOIN team_members m ON p.member_id = m.id
    ORDER BY p.date DESC LIMIT 50
  `).all();

  return NextResponse.json({ members, recentPayments });
}

export async function POST(req: Request) {
  seedDatabase();
  const apiKey = req.headers.get('x-api-key');
  const user = await getCurrentUser();

  if (!validateApiKey(apiKey) && !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const db = getDb();

    if (data.action === 'CREATE_MEMBER') {
      const { name, role, monthly_salary, payment_method, payment_frequency, notes } = data;
      const id = 'tm_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO team_members (id, name, role, monthly_salary, payment_method, payment_frequency, notes, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `);
      stmt.run(id, name, role, Number(monthly_salary) || 0, payment_method || 'PAGO_MOVIL', payment_frequency || 'QUINCENAL', notes || '');
      const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
      return NextResponse.json({ success: true, member: created });
    }

    if (data.action === 'RECORD_PAYMENT') {
      const { member_id, date, period, amount, currency = 'USD', rate_type, rate_applied, amount_bs, payment_method, reference, notes } = data;
      const id = 'pay_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO team_payments (id, member_id, date, period, amount, currency, rate_type, rate_applied, amount_bs, payment_method, reference, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, member_id, date || new Date().toISOString().split('T')[0], period, Number(amount), currency, rate_type, Number(rate_applied) || null, Number(amount_bs) || null, payment_method, reference || '', notes || '');
      const created = db.prepare('SELECT * FROM team_payments WHERE id = ?').get(id);
      return NextResponse.json({ success: true, payment: created });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
