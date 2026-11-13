const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const db = new DatabaseSync(path.join(__dirname, '..', 'data', 'tu_naranja.db'));

// Clean up November Forma Libre docs
db.exec(`
  DELETE FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' 
    AND issue_date >= '2026-11-01'
    AND id IN ('doc_forma_libre_298', 'doc_forma_libre_299', 'doc_forma_libre_300', 'doc_forma_libre_301', 'doc_forma_libre_302');
`);

// 1. Insert Factura 300: MANTICA (Exact match to user's PDF)
const insertDoc = db.prepare(`
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

const manticaItems = [
  { description: 'Manejo de Redes Sociales (noviembre)', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 350 },
  { description: 'Meta ads 100', category: 'MARKETING_ADS', unit: '1.0', quantity: 1, amount: 100, categoryManuallySet: true },
  { description: 'Mes rosa', category: 'GRABACIONES', unit: '1.0', quantity: 1, amount: 40, categoryManuallySet: true }
];

insertDoc.run(
  'doc_forma_libre_300', 'FORMA_LIBRE', 300, 'mantica', 'J-00059876-2', '2026-11-03', '2026-11-03',
  'EMITTED', 'PAID', 'USD', 490.0,
  'BCV', 889.58, 889.58,
  435894.20, 0.16, 69743.07, 505637.27,
  1, 75, 52307.30,
  2, 8717.88, 444612.09, 499.80,
  505637.27, 490.0, JSON.stringify(manticaItems), '',
  'TRANSFERENCIA_BS', 'Confirmado', '2026-11-03', 'Jarvick', null
);

// 2. Insert Factura 301: Centro Cerámico García (with control number 302, rate Promedio)
const garciaItems = [
  { description: 'Manejo mensual de redes sociales (noviembre)', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 140 },
  { description: 'Jornada de grabación mensual en tienda', category: 'GRABACIONES', unit: '1.0', quantity: 1, amount: 30 }
];

insertDoc.run(
  'doc_forma_libre_301', 'FORMA_LIBRE', 301, 'cc-garcia', 'J-31275024-3', '2026-11-03', '2026-11-03',
  'EMITTED', 'PENDING', 'USD', 170.0,
  'PROMEDIO', 946.31, 891.11,
  160872.70, 0.16, 25739.63, 186612.33,
  1, 75, 19304.72,
  2, 3217.45, 164090.16, 149.33,
  180238.12, 170.0, JSON.stringify(garciaItems), 'Cobro mensualidad noviembre a tasa promedio P2P/BCV + Jornada de grabación',
  'TRANSFERENCIA_BS', null, null, 'Jarvick', '302'
);

// Update sequence to 301 so next is 302
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '301')").run();

// Query verification
const docs = db.prepare("SELECT doc_number, control_number, client_id, total_amount_currency, total_bs_applied, subtotal_bs, iva_amount_bs, applied_rate FROM documents WHERE doc_type = 'FORMA_LIBRE' AND issue_date >= '2026-11-01' ORDER BY doc_number ASC").all();
console.log('Verified November Invoices in DB:');
console.log(JSON.stringify(docs, null, 2));
