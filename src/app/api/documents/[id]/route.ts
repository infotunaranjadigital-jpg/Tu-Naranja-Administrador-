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
    const docNumber = body.doc_number !== undefined ? Number(body.doc_number) : existing.doc_number;
    const controlNumber = body.control_number !== undefined ? body.control_number : existing.control_number;

    const stmt = db.prepare(`
      UPDATE documents SET
        payment_status = ?,
        payment_method = ?,
        payment_reference = ?,
        status = ?,
        paid_at = ?,
        doc_number = ?,
        control_number = ?
      WHERE id = ?
    `);

    stmt.run(paymentStatus, paymentMethod, paymentReference, status, paidAt, docNumber, controlNumber, id);

    // Si se actualizó el doc_number de una forma libre, sincronizar la secuencia para las siguientes facturas
    if (body.doc_number && existing.doc_type === 'FORMA_LIBRE') {
      const num = Number(body.doc_number);
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_forma_libre_number') as any;
      const currentLast = row ? parseInt(row.value, 10) : 299;
      if (num >= currentLast) {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', num.toString());
      }
    }

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
