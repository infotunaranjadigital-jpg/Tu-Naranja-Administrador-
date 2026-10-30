import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

function addBusinessDays(startDateStr: string, businessDays: number = 3): string {
  const date = new Date(startDateStr + 'T12:00:00');
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return date.toISOString().split('T')[0];
}

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
    let {
      doc_type, // 'FORMA_LIBRE', 'RECIBO' o 'PRESUPUESTO'
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
      is_paid = false,
      prospect_name,
      prospect_business_name,
      prospect_phone,
      prospect_email,
      prospect_address
    } = data;

    if (!doc_type || (!client_id && !prospect_name) || !items || !items.length) {
      return NextResponse.json({ error: 'Faltan campos requeridos (doc_type, client_id o prospect_name, items)' }, { status: 400 });
    }

    const db = getDb();

    // Si es un prospecto nuevo o no existe cliente, crearlo al vuelo
    let client: any = null;
    if (client_id && client_id !== 'NEW_PROSPECT') {
      client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) as any;
    }

    if (!client && (prospect_name || prospect_business_name)) {
      const pName = (prospect_business_name || prospect_name).trim();
      const slugId = 'pros_' + pName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Date.now().toString().slice(-4);
      
      const insertProspect = db.prepare(`
        INSERT INTO clients (
          id, name, business_name, rif, phone, email, address,
          base_monthly_fee, meta_ads_budget, default_rate_type, billing_day,
          preferred_document, notes, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      insertProspect.run(
        slugId,
        prospect_name || pName,
        prospect_business_name || pName,
        client_rif || null,
        prospect_phone || null,
        prospect_email || null,
        prospect_address || 'Caracas, Venezuela',
        0, 0, 'BCV', 1,
        'RECIBO',
        'Cliente / Prospecto generado desde Presupuesto Online',
      );

      client = db.prepare('SELECT * FROM clients WHERE id = ?').get(slugId) as any;
      client_id = slugId;
    }

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

    // 4.1 Retenciones Fiscales (Agentes de Retención SENIAT)
    const clientIsWithholder = client.is_withholding_agent === 1 || client.id === 'mantica' || client.id === 'cc-garcia';
    const applyWithholding = data.is_withholding_applied !== undefined ? Boolean(data.is_withholding_applied) : (doc_type === 'FORMA_LIBRE' && clientIsWithholder);

    let ivaRetentionPercent = 0;
    let ivaRetentionAmountBs = 0;
    let islrRetentionPercent = 0;
    let islrRetentionAmountBs = 0;
    let netPayableBs = totalBsApplied;
    let netPayableUsd = totalCurrency;

    if (applyWithholding && doc_type === 'FORMA_LIBRE') {
      ivaRetentionPercent = Number(data.iva_retention_percent ?? client.iva_retention_percent ?? 75);
      islrRetentionPercent = Number(data.islr_retention_percent ?? client.islr_retention_percent ?? 2);

      ivaRetentionAmountBs = Number(((ivaAmountBs * ivaRetentionPercent) / 100).toFixed(2));
      islrRetentionAmountBs = Number(((subtotalBs * islrRetentionPercent) / 100).toFixed(2));

      netPayableBs = Number((totalBsApplied - ivaRetentionAmountBs - islrRetentionAmountBs).toFixed(2));
      netPayableUsd = appliedRate > 0 ? Number((netPayableBs / appliedRate).toFixed(2)) : totalCurrency;
    }

    // 5. Calculate sequential document number
    let settingKey = 'last_receipt_number';
    let defaultStart = 359;
    if (doc_type === 'FORMA_LIBRE') {
      settingKey = 'last_forma_libre_number';
      defaultStart = 297;
    } else if (doc_type === 'PRESUPUESTO') {
      settingKey = 'last_presupuesto_number';
      defaultStart = 100;
    }

    const settingRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as any;
    let nextDocNum = (settingRow ? parseInt(settingRow.value, 10) : defaultStart) + 1;

    // Save updated sequence
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(settingKey, nextDocNum.toString());

    // 6. Fechas y Notas
    const calculatedDueDate = doc_type === 'PRESUPUESTO'
      ? (due_date || addBusinessDays(today, 3))
      : (due_date || today);

    let finalNotes = notes || '';
    if (doc_type === 'PRESUPUESTO' && !finalNotes) {
      finalNotes = '• Validez: Presupuesto válido por 3 días hábiles después de su generación.\n• Moneda: Expresado en USD ($), pagadero en Bolívares (Bs.) a la tasa oficial del BCV del día de la transacción.\n• Métodos de Pago: Transferencia Bancaria Mercantil, Pago Móvil, Binance USDT, Efectivo USD o Zelle.';
    }

    // 7. Save document
    const docId = `doc_${doc_type.toLowerCase()}_${nextDocNum}`;
    const insertDoc = db.prepare(`
      INSERT INTO documents (
        id, doc_type, doc_number, client_id, client_rif, issue_date, due_date,
        status, payment_status, currency, total_amount_currency,
        rate_type_applied, applied_rate, bcv_rate_at_issue,
        subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
        is_withholding_applied, iva_retention_percent, iva_retention_amount_bs,
        islr_retention_percent, islr_retention_amount_bs, net_payable_bs, net_payable_usd,
        base_bs_bcv, base_usd_bcv, items_json, notes,
        payment_method, payment_reference, paid_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      docId, doc_type, nextDocNum, client_id, client_rif || client.rif || null, today, calculatedDueDate,
      'EMITTED', is_paid ? 'PAID' : 'PENDING', currency, totalCurrency,
      rate_type_applied, appliedRate, bcvRate,
      subtotalBs, ivaRate, ivaAmountBs, totalBsApplied,
      applyWithholding ? 1 : 0, ivaRetentionPercent, ivaRetentionAmountBs,
      islrRetentionPercent, islrRetentionAmountBs, netPayableBs, netPayableUsd,
      baseBsBcv, baseUsdBcv, JSON.stringify(items), finalNotes,
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
