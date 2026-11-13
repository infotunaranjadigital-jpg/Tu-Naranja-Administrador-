const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'tu_naranja.db'));

(async () => {
  const res = await fetch('https://admin.tunaranjadigital.com/api/documents/doc_forma_libre_300', {
    headers: { 'x-api-key': 'naranja_ai_assistant_key_2026' }
  });
  const data = await res.json();
  const d = data.document;
  if (!d) {
    console.log('Document not found on remote');
    return;
  }

  const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(d.id);
  if (existing) {
    console.log('Already in local DB');
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO documents (
      id, doc_type, doc_number, client_id, client_rif, issue_date, due_date,
      status, payment_status, currency, total_amount_currency,
      rate_type_applied, applied_rate, bcv_rate_at_issue,
      subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
      is_withholding_applied, iva_retention_percent, iva_retention_amount_bs,
      islr_retention_percent, islr_retention_amount_bs, net_payable_bs, net_payable_usd,
      base_bs_bcv, base_usd_bcv, items_json, notes,
      payment_method, payment_reference, paid_at, created_by, control_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    d.id, d.doc_type, d.doc_number, d.client_id, d.client_rif, d.issue_date, d.due_date,
    d.status, d.payment_status, d.currency, d.total_amount_currency,
    d.rate_type_applied, d.applied_rate, d.bcv_rate_at_issue,
    d.subtotal_bs, d.iva_rate, d.iva_amount_bs, d.total_bs_applied,
    d.is_withholding_applied, d.iva_retention_percent, d.iva_retention_amount_bs,
    d.islr_retention_percent, d.islr_retention_amount_bs, d.net_payable_bs, d.net_payable_usd,
    d.base_bs_bcv, d.base_usd_bcv, d.items_json, d.notes,
    d.payment_method, d.payment_reference, d.paid_at, d.created_by, d.control_number
  );
  console.log('Local DB successfully synced with Factura 300!');
})();
