import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: Request) {
  seedDatabase();
  const db = getDb();

  const stmt = db.prepare(`
    SELECT 
      c.*,
      (SELECT MAX(date) FROM client_fee_history WHERE client_id = c.id) as last_fee_adjustment_date,
      (SELECT COUNT(*) FROM documents WHERE client_id = c.id) as total_documents_count,
      (SELECT SUM(base_bs_bcv) FROM documents WHERE client_id = c.id AND strftime('%Y', issue_date) = strftime('%Y', 'now')) as annual_invoiced_base_bs,
      (SELECT SUM(base_usd_bcv) FROM documents WHERE client_id = c.id AND strftime('%Y', issue_date) = strftime('%Y', 'now')) as annual_invoiced_base_usd
    FROM clients c
    ORDER BY c.base_monthly_fee DESC, c.name ASC
  `);

  const clients = stmt.all();
  return NextResponse.json({ clients });
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
    const {
      name, business_name, rif, phone, email, address,
      default_currency, base_monthly_fee, meta_ads_budget,
      default_rate_type, billing_day, preferred_document, notes,
      is_withholding_agent = 0,
      iva_retention_percent = 75,
      islr_retention_percent = 2
    } = data;

    if (!name) {
      return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 });
    }

    const id = data.id || 'cli_' + Date.now();
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO clients (
        id, name, business_name, rif, phone, email, address,
        default_currency, base_monthly_fee, meta_ads_budget,
        default_rate_type, billing_day, preferred_document, notes,
        is_withholding_agent, iva_retention_percent, islr_retention_percent,
        active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    stmt.run(
      id, name, business_name || name, rif || '', phone || '', email || '', address || '',
      default_currency || 'USD', Number(base_monthly_fee) || 0, Number(meta_ads_budget) || 0,
      default_rate_type || 'BCV', Number(billing_day) || 1, preferred_document || 'RECIBO',
      notes || '', Number(is_withholding_agent) ? 1 : 0, Number(iva_retention_percent) || 75, Number(islr_retention_percent) || 2
    );

    // Initial fee record in history
    if (Number(base_monthly_fee) > 0) {
      const histStmt = db.prepare(`
        INSERT INTO client_fee_history (id, client_id, date, previous_fee, new_fee, reason, created_by)
        VALUES (?, ?, date('now'), ?, ?, ?, ?)
      `);
      histStmt.run(
        'hist_' + Date.now(), id, 0, Number(base_monthly_fee),
        'Tarifa inicial de alta', user ? user.name : 'AI Assistant'
      );
    }

    const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json({ success: true, client: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
