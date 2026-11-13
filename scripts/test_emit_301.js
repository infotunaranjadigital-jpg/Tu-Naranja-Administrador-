const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'tu_naranja.db'));

// Check rates
const today = '2026-11-03';
let rateRow = db.prepare('SELECT * FROM exchange_rates WHERE date = ?').get(today);
if (!rateRow) {
  rateRow = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get();
}
console.log('Using rateRow:', rateRow);

const bcvRate = Number(rateRow?.bcv_usd || 891.11);
const avgRate = Number(rateRow?.average_usd || 946.31);
const appliedRate = avgRate;

const totalUsd = 170.0;
const subtotalBs = Number((totalUsd * appliedRate).toFixed(2));
const ivaBs = Number((subtotalBs * 0.16).toFixed(2));
const totalBs = Number((subtotalBs + ivaBs).toFixed(2));

const ivaRetBs = Number(((ivaBs * 75) / 100).toFixed(2));
const islrRetBs = Number(((subtotalBs * 2) / 100).toFixed(2));
const netPayableBs = Number((totalBs - ivaRetBs - islrRetBs).toFixed(2));
const netPayableUsd = Number((netPayableBs / appliedRate).toFixed(2));

const baseBsBcv = Number((totalUsd * bcvRate * 1.16).toFixed(2));
const baseUsdBcv = totalUsd;

const items = [
  {
    description: 'Manejo mensual de redes sociales (noviembre)',
    category: 'MARKETING_RRSS',
    unit: '1.0',
    quantity: 1,
    amount: 140.0
  },
  {
    description: 'Jornada de grabación presencial en tienda',
    category: 'GRABACIONES',
    unit: '1.0',
    quantity: 1,
    amount: 30.0
  }
];

console.log({
  appliedRate,
  bcvRate,
  totalUsd,
  subtotalBs,
  ivaBs,
  totalBs,
  ivaRetBs,
  islrRetBs,
  netPayableBs,
  netPayableUsd
});

// Update feminaid
db.exec(`UPDATE clients SET base_monthly_fee = 0.0, notes = 'Cliente para trabajos puntuales (rotulados e impresiones especiales). No tiene mensualidad fija de redes sociales.' WHERE id = 'feminaid'`);

// Delete if exists and insert 301
db.prepare("DELETE FROM documents WHERE id = 'doc_forma_libre_301'").run();

const insertStmt = db.prepare(`
  INSERT INTO documents (
    id, doc_type, doc_number, client_id, client_rif, issue_date, due_date,
    status, payment_status, currency, total_amount_currency,
    rate_type_applied, applied_rate, bcv_rate_at_issue,
    subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
    is_withholding_applied, iva_retention_percent, iva_retention_amount_bs,
    islr_retention_percent, islr_retention_amount_bs, net_payable_bs, net_payable_usd,
    base_bs_bcv, base_usd_bcv, items_json, notes,
    payment_method, payment_reference, paid_at, created_by, control_number
  ) VALUES (
    'doc_forma_libre_301', 'FORMA_LIBRE', 301, 'cc-garcia', 'J-31275024-3', '2026-11-03', '2026-11-03',
    'EMITTED', 'PENDING', 'USD', 170.0,
    'PROMEDIO', ?, ?,
    ?, 0.16, ?, ?,
    1, 75, ?,
    2, ?, ?, ?,
    ?, ?, ?, 'Cobro mensualidad noviembre a tasa promedio P2P/BCV + Jornada de grabación',
    'TRANSFERENCIA_BS', null, null, 'Jarvick', null
  )
`);

insertStmt.run(
  appliedRate, bcvRate,
  subtotalBs, ivaBs, totalBs,
  ivaRetBs, islrRetBs, netPayableBs, netPayableUsd,
  baseBsBcv, baseUsdBcv, JSON.stringify(items)
);

db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', '301');

const docCreated = db.prepare("SELECT * FROM documents WHERE id = 'doc_forma_libre_301'").get();
console.log('Doc 301 created successfully:', docCreated);
