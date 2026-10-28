import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const doc = db.prepare(`
    SELECT 
      d.*,
      c.name as client_name,
      c.business_name as client_business_name,
      c.rif as client_rif,
      c.phone as client_phone,
      c.email as client_email,
      c.address as client_address
    FROM documents d
    JOIN clients c ON d.client_id = c.id
    WHERE d.id = ?
  `).get(id);

  if (!doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}

export async function PATCH(
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
    const body = await req.json();
    const db = getDb();

    const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
    if (!existing) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const paymentStatus = body.payment_status ?? existing.payment_status;
    const paymentMethod = body.payment_method ?? existing.payment_method;
    const paymentReference = body.payment_reference ?? existing.payment_reference;
    const status = body.status ?? existing.status;
    const paidAt = paymentStatus === 'PAID' ? (existing.paid_at || new Date().toISOString()) : null;

    const stmt = db.prepare(`
      UPDATE documents SET
        payment_status = ?,
        payment_method = ?,
        payment_reference = ?,
        status = ?,
        paid_at = ?
      WHERE id = ?
    `);

    stmt.run(paymentStatus, paymentMethod, paymentReference, status, paidAt, id);

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
