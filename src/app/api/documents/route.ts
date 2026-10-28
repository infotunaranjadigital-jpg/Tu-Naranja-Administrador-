import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: Request) {
  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);

  const docType = searchParams.get('type'); // 'FORMA_LIBRE', 'RECIBO'
  const clientId = searchParams.get('client_id');
  const month = searchParams.get('month'); // YYYY-MM
  const paymentStatus = searchParams.get('payment_status'); // 'PENDING', 'PAID'

  let sql = `
    SELECT 
      d.*,
      c.name as client_name,
      c.business_name as client_business_name,
      COALESCE(d.client_rif, c.rif) as client_rif,
      c.phone as client_phone,
      c.address as client_address
    FROM documents d
    JOIN clients c ON d.client_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (docType) {
    sql += ' AND d.doc_type = ?';
    params.push(docType);
  }
  if (clientId) {
    sql += ' AND d.client_id = ?';
    params.push(clientId);
  }
  if (month) {
    sql += " AND strftime('%Y-%m', d.issue_date) = ?";
    params.push(month);
  }
  if (paymentStatus) {
    sql += ' AND d.payment_status = ?';
    params.push(paymentStatus);
  }

  sql += ' ORDER BY d.issue_date DESC, d.doc_number DESC';

  const stmt = db.prepare(sql);
  const docs = stmt.all(...params);

  return NextResponse.json({ documents: docs });
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
      doc_type, // 'FORMA_LIBRE' o 'RECIBO'
      client_id,
      client_rif,
      issue_date,
      due_date,
      currency = 'USD',
      total_amount_currency,
      rate_type_applied, // 'BCV', 'BINANCE', 'PROMEDIO', 'EURO', 'EFECTIVO', 'CUSTOM'
      custom_rate,
      items, // array of { description, unit, quantity, unitPrice, amount }
      notes,
      payment_method,
      payment_reference,
      is_paid = false
    } = data;

    if (!doc_type || !client_id || !items || !items.length) {
      return NextResponse.json({ error: 'Faltan campos requeridos (doc_type, client_id, items)' }, { status: 400 });
    }

    const db = getDb();
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) as any;
    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // 1. Fetch current exchange rates
    const today = issue_date || new Date().toISOString().split('T')[0];
    let rateRow = db.prepare('SELECT * FROM exchange_rates WHERE date = ?').get(today) as any;
    if (!rateRow) {
      rateRow = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
    }

    const bcvRate = Number(rateRow?.bcv_usd || 866.56);
    const binanceRate = Number(rateRow?.binance_usdt || 920.00);
    const avgRate = Number(rateRow?.average_usd || ((bcvRate + binanceRate) / 2));
    const eurRate = Number(rateRow?.bcv_eur || (bcvRate * 1.08));

    // 2. Determine applied rate
    let appliedRate = bcvRate;
    if (rate_type_applied === 'BINANCE') appliedRate = binanceRate;
    else if (rate_type_applied === 'PROMEDIO') appliedRate = avgRate;
    else if (rate_type_applied === 'EURO') appliedRate = eurRate;
    else if (rate_type_applied === 'EFECTIVO') appliedRate = bcvRate; // En efectivo se liquida valor facial en USD
    else if (rate_type_applied === 'CUSTOM' && custom_rate) appliedRate = Number(custom_rate);

    // 3. Compute totals
    let totalCurrency = Number(total_amount_currency) || 0;
    if (!totalCurrency) {
      totalCurrency = items.reduce((acc: number, it: any) => acc + (Number(it.amount) || 0), 0);
    }

    let subtotalBs = 0;
    let ivaRate = doc_type === 'FORMA_LIBRE' ? 0.16 : 0.0;
    let ivaAmountBs = 0;
    let totalBsApplied = 0;

    if (currency === 'USD') {
      subtotalBs = Number((totalCurrency * appliedRate).toFixed(2));
      ivaAmountBs = Number((subtotalBs * ivaRate).toFixed(2));
      totalBsApplied = Number((subtotalBs + ivaAmountBs).toFixed(2));
    } else {
      // Currency is already VES
      totalBsApplied = totalCurrency;
      subtotalBs = Number((totalBsApplied / (1 + ivaRate)).toFixed(2));
      ivaAmountBs = Number((totalBsApplied - subtotalBs).toFixed(2));
    }

    // 4. Compute UNIDAD BASE BCV (La referencia contable oficial)
    const baseBsBcv = currency === 'USD' 
      ? Number((totalCurrency * bcvRate * (1 + ivaRate)).toFixed(2))
      : totalBsApplied;
    const baseUsdBcv = Number((baseBsBcv / bcvRate).toFixed(2));

    // 5. Calculate sequential document number
    const settingKey = doc_type === 'FORMA_LIBRE' ? 'last_forma_libre_number' : 'last_receipt_number';
    const settingRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as any;
    let nextDocNum = (settingRow ? parseInt(settingRow.value, 10) : (doc_type === 'FORMA_LIBRE' ? 297 : 359)) + 1;

    // Save updated sequence
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(settingKey, nextDocNum.toString());

    // 6. Save document
    const docId = `doc_${doc_type.toLowerCase()}_${nextDocNum}`;
    const insertDoc = db.prepare(`
      INSERT INTO documents (
        id, doc_type, doc_number, client_id, client_rif, issue_date, due_date,
        status, payment_status, currency, total_amount_currency,
        rate_type_applied, applied_rate, bcv_rate_at_issue,
        subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
        base_bs_bcv, base_usd_bcv, items_json, notes,
        payment_method, payment_reference, paid_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      docId, doc_type, nextDocNum, client_id, client_rif || client.rif || null, today, due_date || today,
      'EMITTED', is_paid ? 'PAID' : 'PENDING', currency, totalCurrency,
      rate_type_applied, appliedRate, bcvRate,
      subtotalBs, ivaRate, ivaAmountBs, totalBsApplied,
      baseBsBcv, baseUsdBcv, JSON.stringify(items), notes || '',
      payment_method || null, payment_reference || null,
      is_paid ? new Date().toISOString() : null,
      user ? user.name : 'AI Assistant'
    );

    const created = db.prepare(`
      SELECT d.*, c.name as client_name, c.business_name as client_business_name, c.rif as client_rif, c.phone as client_phone, c.address as client_address
      FROM documents d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?
    `).get(docId);

    return NextResponse.json({ success: true, document: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
