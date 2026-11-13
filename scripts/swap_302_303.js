const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

console.log('--- Restableciendo Factura 302 (Centro Cerámico García) y Factura 303 (Aguerrefem) ---');

// Eliminar 302 y 303 actuales
db.exec(`
  DELETE FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' 
    AND id IN ('doc_forma_libre_302', 'doc_forma_libre_303');
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

// 1. Factura 302: Centro Cerámico García (Manejo $140 + Grabación $30 = $170 USD, Tasa Promedio 946.31, Control 302)
const garciaItems = [
  { description: 'Manejo mensual de redes sociales (noviembre)', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 140 },
  { description: 'Jornada de grabación mensual en tienda', category: 'GRABACIONES', unit: '1.0', quantity: 1, amount: 30 }
];

insertDoc.run(
  'doc_forma_libre_302', 'FORMA_LIBRE', 302, 'cc-garcia', 'J-31275024-3', '2026-11-03', '2026-11-03',
  'EMITTED', 'PAID', 'USD', 170.0,
  'PROMEDIO', 946.31, 891.11,
  160872.70, 0.16, 25739.63, 186612.33,
  1, 75, 19304.72,
  2, 3217.45, 164090.16, 149.33,
  180238.12, 170.0, JSON.stringify(garciaItems),
  'Cobro mensualidad noviembre a tasa promedio P2P/BCV + Jornada de grabación',
  'TRANSFERENCIA_BS', null, '2026-11-03', 'Jarvick', '302'
);

// 2. Factura 303: Aguerrefem (Servicios Feminaid) - 100 pulseras cáncer de mama (Bs. 51.046,72 Total con IVA)
const bcvAguerrefem = 896.12;
const totalBs303 = 51046.72;
const subtotalBs303 = 44005.79;
const ivaBs303 = 7040.93;
const usdEq303 = Number((totalBs303 / bcvAguerrefem).toFixed(2)); // 56.96 USD

const aguerrefemItems = [
  {
    description: '100 pulseras cáncer de mama',
    category: 'MATERIAL_IMPRESO',
    unit: 'Unidades',
    quantity: 100,
    unitPrice: 440.06,
    amount: subtotalBs303
  }
];

insertDoc.run(
  'doc_forma_libre_303', 'FORMA_LIBRE', 303, 'feminaid', 'J-50125683-7', '2026-11-06', '2026-11-06',
  'EMITTED', 'PAID', 'VES', subtotalBs303,
  'BCV', bcvAguerrefem, bcvAguerrefem,
  subtotalBs303, 0.16, ivaBs303, totalBs303,
  0, 0, 0,
  0, 0, totalBs303, usdEq303,
  totalBs303, usdEq303, JSON.stringify(aguerrefemItems),
  '100 pulseras campaña cáncer de mama',
  'TRANSFERENCIA_BS', null, '2026-11-06', 'Jarvick', '303'
);

db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '303')").run();

console.log('Facturas 302 y 303 configuradas correctamente.');

const docs = db.prepare(`
  SELECT doc_number, doc_type, client_id, control_number, currency, total_amount_currency, subtotal_bs, iva_amount_bs, total_bs_applied, base_usd_bcv, issue_date
  FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' AND doc_number >= 300
  ORDER BY doc_number ASC
`).all();

console.log(JSON.stringify(docs, null, 2));
