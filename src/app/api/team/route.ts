import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase, syncCanonicalTeam } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  syncCanonicalTeam();
  const db = getDb();

  const members = db.prepare(`
    SELECT 
      m.*,
      (SELECT COUNT(*) FROM team_payments WHERE member_id = m.id) as payments_count,
      (SELECT SUM(amount) FROM team_payments WHERE member_id = m.id AND strftime('%Y', date) = strftime('%Y', 'now')) as annual_paid
    FROM team_members m
    ORDER BY 
      CASE m.id 
        WHEN 'tm_isabelle' THEN 1
        WHEN 'tm_angie' THEN 2
        WHEN 'tm_adis' THEN 3
        WHEN 'tm_mariana' THEN 4
        WHEN 'tm_eleonora' THEN 5
        ELSE 6
      END ASC
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
      const { name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes } = data;
      const id = 'tm_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO team_members (id, name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      stmt.run(
        id, 
        name, 
        role, 
        Number(monthly_salary) || 0, 
        payment_method || 'PAGO_MOVIL', 
        payment_frequency || 'QUINCENAL', 
        rate_rule || 'BCV', 
        incentive_rule || '', 
        notes || ''
      );
      const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
      return NextResponse.json({ success: true, member: created });
    }

    if (data.action === 'UPDATE_MEMBER') {
      const { id, name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes, active } = data;
      const stmt = db.prepare(`
        UPDATE team_members SET
          name = COALESCE(?, name),
          role = COALESCE(?, role),
          monthly_salary = COALESCE(?, monthly_salary),
          payment_method = COALESCE(?, payment_method),
          payment_frequency = COALESCE(?, payment_frequency),
          rate_rule = COALESCE(?, rate_rule),
          incentive_rule = COALESCE(?, incentive_rule),
          notes = COALESCE(?, notes),
          active = COALESCE(?, active)
        WHERE id = ?
      `);
      stmt.run(
        name, 
        role, 
        monthly_salary !== undefined ? Number(monthly_salary) : null, 
        payment_method, 
        payment_frequency, 
        rate_rule, 
        incentive_rule, 
        notes, 
        active !== undefined ? (active ? 1 : 0) : null,
        id
      );
      const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
      return NextResponse.json({ success: true, member: updated });
    }

    if (data.action === 'DELETE_MEMBER') {
      const { id } = data;
      db.prepare('DELETE FROM team_payments WHERE member_id = ?').run(id);
      db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
      return NextResponse.json({ success: true, message: 'Colaborador eliminado' });
    }

    if (data.action === 'RESET_CANONICAL') {
      syncCanonicalTeam();
      return NextResponse.json({ success: true, message: 'Equipo restablecido con los 5 integrantes canónicos' });
    }

    if (data.action === 'RECORD_PAYMENT') {
      const { member_id, date, period, amount, currency = 'USD', rate_type, rate_applied, amount_bs, payment_method, reference, notes } = data;
      const id = 'pay_' + Date.now();
      const stmt = db.prepare(`
        INSERT INTO team_payments (id, member_id, date, period, amount, currency, rate_type, rate_applied, amount_bs, payment_method, reference, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, 
        member_id, 
        date || new Date().toISOString().split('T')[0], 
        period, 
        Number(amount), 
        currency, 
        rate_type || 'BCV', 
        Number(rate_applied) || null, 
        Number(amount_bs) || null, 
        payment_method, 
        reference || '', 
        notes || ''
      );
      const created = db.prepare('SELECT * FROM team_payments WHERE id = ?').get(id);
      return NextResponse.json({ success: true, payment: created });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
