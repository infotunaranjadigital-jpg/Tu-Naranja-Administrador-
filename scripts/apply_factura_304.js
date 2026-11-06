const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

console.log('--- Cambiando numeración de Factura Feminaid de 302 a 304 ---');

// 1. Eliminar doc 302 y 304 si existen
db.exec(`
  DELETE FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' 
    AND id IN ('doc_forma_libre_302', 'doc_forma_libre_304');
`);

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

// 2. Factura 304: Aguerrefem (Servicios Feminaid) - 100 pulseras cáncer de mama (Bs. 51.046,72 Total con IVA)
const bcvAguerrefem = 896.12;
const totalBs304 = 51046.72;
const subtotalBs304 = 44005.79;
const ivaBs304 = 7040.93;
const usdEq304 = Number((totalBs304 / bcvAguerrefem).toFixed(2)); // 56.96 USD

const aguerrefemItems = [
  {
    description: '100 pulseras cáncer de mama',
    category: 'MATERIAL_IMPRESO',
    unit: 'Unidades',
    quantity: 100,
    unitPrice: 440.06,
    amount: subtotalBs304
  }
];

insertDoc.run(
  'doc_forma_libre_304', 'FORMA_LIBRE', 304, 'feminaid', 'J-50125683-7', '2026-11-06', '2026-11-06',
  'EMITTED', 'PAID', 'VES', subtotalBs304,
  'BCV', bcvAguerrefem, bcvAguerrefem,
  subtotalBs304, 0.16, ivaBs304, totalBs304,
  0, 0, 0,
  0, 0, totalBs304, usdEq304,
  totalBs304, usdEq304, JSON.stringify(aguerrefemItems),
  '100 pulseras campaña cáncer de mama',
  'TRANSFERENCIA_BS', null, '2026-11-06', 'Jarvick', '304'
);

// 3. Correlativo permanece en 305
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '305')").run();

console.log('Factura #304 configurada con éxito.');

// Verificar documentos noviembre
const docs = db.prepare(`
  SELECT doc_number, doc_type, status, payment_status, client_id, control_number, currency, total_amount_currency, subtotal_bs, iva_amount_bs, total_bs_applied, base_usd_bcv, issue_date
  FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' AND doc_number >= 300
  ORDER BY doc_number ASC
`).all();

console.log('Documentos actualizados:');
console.log(JSON.stringify(docs, null, 2));
