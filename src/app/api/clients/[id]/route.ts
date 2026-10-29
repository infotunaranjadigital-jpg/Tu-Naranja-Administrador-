import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!client) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const feeHistory = db.prepare('SELECT * FROM client_fee_history WHERE client_id = ? ORDER BY date DESC').all(id);
  const documents = db.prepare('SELECT * FROM documents WHERE client_id = ? ORDER BY issue_date DESC').all(id);

  return NextResponse.json({
    client,
    fee_history: feeHistory,
    documents
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = req.headers.get('x-api-key');
  const user = await getCurrentUser();

  if (!validateApiKey(apiKey) && !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    const db = getDb();

    const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Check if fee changed to register in history
    const newFee = Number(data.base_monthly_fee ?? existing.base_monthly_fee);
    if (newFee !== existing.base_monthly_fee && data.fee_adjustment_reason) {
      const histStmt = db.prepare(`
        INSERT INTO client_fee_history (id, client_id, date, previous_fee, new_fee, reason, created_by)
        VALUES (?, ?, date('now'), ?, ?, ?, ?)
      `);
      histStmt.run(
        'hist_' + Date.now(), id, existing.base_monthly_fee, newFee,
        data.fee_adjustment_reason || 'Ajuste de tarifa', user ? user.name : 'AI Assistant'
      );
    }

    const stmt = db.prepare(`
      UPDATE clients SET
        name = ?,
        business_name = ?,
        rif = ?,
        phone = ?,
        email = ?,
        address = ?,
        default_currency = ?,
        base_monthly_fee = ?,
        meta_ads_budget = ?,
        default_rate_type = ?,
        billing_day = ?,
        preferred_document = ?,
        notes = ?,
        is_withholding_agent = ?,
        iva_retention_percent = ?,
        islr_retention_percent = ?,
        active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      data.name ?? existing.name,
      data.business_name ?? existing.business_name,
      data.rif ?? existing.rif,
      data.phone ?? existing.phone,
      data.email ?? existing.email,
      data.address ?? existing.address,
      data.default_currency ?? existing.default_currency,
      newFee,
      Number(data.meta_ads_budget ?? existing.meta_ads_budget),
      data.default_rate_type ?? existing.default_rate_type,
      Number(data.billing_day ?? existing.billing_day),
      data.preferred_document ?? existing.preferred_document,
      data.notes ?? existing.notes,
      data.is_withholding_agent !== undefined ? (data.is_withholding_agent ? 1 : 0) : existing.is_withholding_agent,
      data.iva_retention_percent !== undefined ? Number(data.iva_retention_percent) : existing.iva_retention_percent,
      data.islr_retention_percent !== undefined ? Number(data.islr_retention_percent) : existing.islr_retention_percent,
      data.active !== undefined ? Number(data.active) : existing.active,
      id
    );

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
