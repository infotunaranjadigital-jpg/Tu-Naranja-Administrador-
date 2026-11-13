const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

console.log('--- Configurando Factura 302 (Aguerrefem) y Factura 303 (Centro Ceramico) ---');

// 1. Asegurar tasa BCV de hoy (2026-11-06)
const today = '2026-11-06';
const bcvRate = 896.12;
const bcvEur = 1004.96;
const binanceUsdt = 1009.95;
const avgRate = 953.04;

db.prepare(`
  INSERT INTO exchange_rates (id, date, bcv_usd, bcv_eur, binance_usdt, average_usd, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(date) DO UPDATE SET
    bcv_usd = excluded.bcv_usd,
    bcv_eur = excluded.bcv_eur,
    binance_usdt = excluded.binance_usdt,
    average_usd = excluded.average_usd,
    updated_at = CURRENT_TIMESTAMP
`).run(`rate_${today}`, today, bcvRate, bcvEur, binanceUsdt, avgRate);

// 2. Asegurar cliente feminaid (Aguerrefem)
db.prepare(`
  UPDATE clients 
  SET name = 'Aguerrefem (Servicios Feminaid 2021 CA)',
      business_name = 'Servicios Feminaid 2021 CA',
      base_monthly_fee = 0.0,
      preferred_document = 'FORMA_LIBRE',
      default_rate_type = 'BCV',
      notes = 'Cliente para trabajos puntuales (rotulados, impresiones especiales, pulseras de campaña). No tiene mensualidad fija de redes sociales.'
  WHERE id = 'feminaid'
`).run();

// 3. Eliminar documentos 302 y 303 existentes para inserción limpia
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

// 4. Factura 302: Aguerrefem (51.046,72 Bs Total con IVA)
// Subtotal (Base Imponible) = 51.046,72 / 1.16 = 44.005,79 Bs
// IVA 16% = 7.040,93 Bs
// Total a Pagar = 51.046,72 Bs
const totalBs302 = 51046.72;
const subtotalBs302 = 44005.79;
const ivaBs302 = 7040.93;
const usdEquivalent = Number((totalBs302 / bcvRate).toFixed(2)); // 56.96 USD

const aguerrefemItems = [
  {
    description: '100 pulseras cáncer de mama',
    category: 'MATERIAL_IMPRESO',
    unit: 'Unidades',
    quantity: 100,
    unitPrice: 440.06,
    amount: subtotalBs302
  }
];

insertDoc.run(
  'doc_forma_libre_302', 'FORMA_LIBRE', 302, 'feminaid', 'J-50125683-7', today, today,
  'EMITTED', 'PENDING', 'VES', subtotalBs302,
  'BCV', bcvRate, bcvRate,
  subtotalBs302, 0.16, ivaBs302, totalBs302,
  0, 0, 0,
  0, 0, totalBs302, usdEquivalent,
  totalBs302, usdEquivalent, JSON.stringify(aguerrefemItems),
  '100 pulseras campaña cáncer de mama',
  'TRANSFERENCIA_BS', null, null, 'Jarvick', '302'
);

// 5. Factura 303: Centro Cerámico García (Manejo mensual $140 + Grabación $30 = $170 a Tasa Promedio 946.31)
const garciaItems = [
  { description: 'Manejo mensual de redes sociales (noviembre)', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 140 },
  { description: 'Jornada de grabación mensual en tienda', category: 'GRABACIONES', unit: '1.0', quantity: 1, amount: 30 }
];

insertDoc.run(
  'doc_forma_libre_303', 'FORMA_LIBRE', 303, 'cc-garcia', 'J-31275024-3', '2026-11-03', '2026-11-03',
  'EMITTED', 'PENDING', 'USD', 170.0,
  'PROMEDIO', 946.31, 891.11,
  160872.70, 0.16, 25739.63, 186612.33,
  1, 75, 19304.72,
  2, 3217.45, 164090.16, 149.33,
  180238.12, 170.0, JSON.stringify(garciaItems),
  'Cobro mensualidad noviembre a tasa promedio P2P/BCV + Jornada de grabación',
  'TRANSFERENCIA_BS', null, null, 'Jarvick', '302'
);

// 6. Actualizar correlativo de forma libre a 303
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '303')").run();

console.log('Facturas actualizadas con éxito.');

// Verificar lista
const docs = db.prepare(`
  SELECT doc_number, doc_type, client_id, currency, total_amount_currency, subtotal_bs, iva_amount_bs, total_bs_applied, issue_date, notes
  FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' AND doc_number >= 300
  ORDER BY doc_number ASC
`).all();

console.log(JSON.stringify(docs, null, 2));
