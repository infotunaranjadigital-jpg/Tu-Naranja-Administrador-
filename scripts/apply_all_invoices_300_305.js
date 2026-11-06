const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

console.log('--- Configurando Correlativo Oficial Noviembre: 300, 301, 302 (Garcia), 303 (SVM), 304 (Feminaid), 305 (Mantica) ---');

// 1. Limpiar documentos 300 a 305 de Forma Libre
db.exec(`
  DELETE FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' 
    AND id IN ('doc_forma_libre_300', 'doc_forma_libre_301', 'doc_forma_libre_302', 'doc_forma_libre_303', 'doc_forma_libre_304', 'doc_forma_libre_305');
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

// ==========================================
// 1. FACTURA 300: Leopoldo Aguerrevere (ANULADA)
// ==========================================
const prostataItems = [
  { description: 'Diseño Gráfico & Conceptualización Temática (Noviembre Azul)', category: 'MARKETING_RRSS', unit: 'Paquete', quantity: 1, unitPrice: 120.0, amount: 120.0, amount_bs: 106853.26, unit_price_bs: 106853.26 },
  { description: 'Viniles Laminados para Ascensores (Efecto Continuo de Unión)', category: 'MATERIAL_IMPRESO', unit: 'Ascensores', quantity: 2, unitPrice: 94.5, amount: 189.0, amount_bs: 168293.89, unit_price_bs: 84146.94 },
  { description: 'Rotulado de Stickers en Cristales y Ventanales', category: 'MATERIAL_IMPRESO', unit: 'Ventanas', quantity: 3, unitPrice: 16.67, amount: 50.0, amount_bs: 44522.19, unit_price_bs: 14840.73 },
  { description: 'Impresión y Rotulado de Logos Institucionales / Campaña', category: 'MATERIAL_IMPRESO', unit: 'Unidades', quantity: 4, unitPrice: 11.25, amount: 45.0, amount_bs: 40069.98, unit_price_bs: 10017.49 }
];

insertDoc.run(
  'doc_forma_libre_300', 'FORMA_LIBRE', 300, 'mantica', 'J-00059876-2', '2026-11-04', '2026-11-04',
  'CANCELLED', 'CANCELLED', 'USD', 404.0,
  'BCV', 893.22, 893.22,
  360860.88, 0.16, 57737.74, 418598.62,
  1, 75, 43303.31,
  2, 7217.22, 368078.09, 412.08,
  418598.62, 404.0, JSON.stringify(prostataItems),
  'ANULADA - Impresa con error de cálculo por anticipos a tasa previa. Reemplazada por Factura Nº 305.',
  'TRANSFERENCIA_BS', null, null, 'Jarvick', null
);

// ==========================================
// 2. FACTURA 301: MANTICA - Mensualidad Noviembre
// ==========================================
const manticaItems = [
  { description: 'Manejo de Redes Sociales (noviembre)', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 350 },
  { description: 'Meta ads 100', category: 'MARKETING_ADS', unit: '1.0', quantity: 1, amount: 100, categoryManuallySet: true },
  { description: 'Mes rosa', category: 'GRABACIONES', unit: '1.0', quantity: 1, amount: 40, categoryManuallySet: true }
];

insertDoc.run(
  'doc_forma_libre_301', 'FORMA_LIBRE', 301, 'mantica', 'J-00059876-2', '2026-11-03', '2026-11-03',
  'EMITTED', 'PAID', 'USD', 490.0,
  'BCV', 889.58, 889.58,
  435894.20, 0.16, 69743.07, 505637.27,
  1, 75, 52307.30,
  2, 8717.88, 444612.09, 499.80,
  505637.27, 490.0, JSON.stringify(manticaItems), 'Mensualidad Noviembre 2026 MANTICA',
  'TRANSFERENCIA_BS', 'Confirmado', '2026-11-03', 'Jarvick', null
);

// ==========================================
// 3. FACTURA 302: CENTRO CERAMICO GARCIA I, C.A.
// ==========================================
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
  'TRANSFERENCIA_BS', 'Confirmado', '2026-11-03', 'Jarvick', '302'
);

// ==========================================
// 4. FACTURA 303: SOCIEDAD VENEZOLANA DE MASTOLOGIA (SVM)
// ==========================================
const bcvSvm = 893.22;
const subtotalBs303 = 214372.80;
const ivaBs303 = 34299.65;
const totalBs303 = 248672.45;
const svmUsd = 240.0;

const svmItems = [
  {
    description: 'Manejo de Redes Sociales (noviembre)',
    category: 'MARKETING_RRSS',
    unit: '1.0',
    quantity: 1,
    unitPrice: svmUsd,
    amount: svmUsd,
    amount_bs: subtotalBs303,
    unit_price_bs: subtotalBs303
  }
];

insertDoc.run(
  'doc_forma_libre_303', 'FORMA_LIBRE', 303, 'soc-mastologia', 'J-00331364-5', '2026-11-04', '2026-11-04',
  'EMITTED', 'PAID', 'USD', svmUsd,
  'BCV', bcvSvm, bcvSvm,
  subtotalBs303, 0.16, ivaBs303, totalBs303,
  0, 0, 0,
  0, 0, totalBs303, svmUsd,
  totalBs303, svmUsd, JSON.stringify(svmItems),
  'Manejo de Redes Sociales noviembre SVM',
  'TRANSFERENCIA_BS', 'Confirmado', '2026-11-04', 'Jarvick', null
);

// ==========================================
// 5. FACTURA 304: SERVICIOS FEMINAID 2021 CA (AGUERREFEM)
// ==========================================
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
  'TRANSFERENCIA_BS', 'Confirmado', '2026-11-06', 'Jarvick', '304'
);

// ==========================================
// 6. FACTURA 305: CLÍNICA LEOPOLDO AGUERREVERE (MATERNO INFANTIL C.A.)
// ==========================================
const baseBs305 = 359739.32;
const ivaBs305 = 57558.29;
const totalBs305 = 417297.61;
const effectiveRate = Number((baseBs305 / 404.0).toFixed(6)); // 890.443861
const ivaRet305 = 57558.29; // 100% Retención IVA
const islrRet305 = 7194.79; // 2% ISLR
const pagadoFacturaNeto = 343551.05; // 417.297,61 - 57.558,29 - 7.194,79 - 8.993,48

insertDoc.run(
  'doc_forma_libre_305', 'FORMA_LIBRE', 305, 'mantica', 'J-00059876-2', '2026-11-04', '2026-11-04',
  'EMITTED', 'PAID', 'USD', 404.0,
  'BCV', effectiveRate, 893.22,
  baseBs305, 0.16, ivaBs305, totalBs305,
  1, 100, ivaRet305,
  2, islrRet305, pagadoFacturaNeto, 385.82,
  totalBs305, 404.0, JSON.stringify(prostataItems),
  'Campaña Noviembre Azul / Prevención Cáncer de Próstata - Cotización TND-2026-1055-OP1. Liquidación según comprobante de pago: Anticipo 30/10/2026 Bs. 251.481,39 ($282,80 a TC 889,26). Saldo pagado 04/11/2026 Bs. 92.069,66 ($121,20 a TC 893,22, Ref. Mercantil 0047900004480). Retenciones aplicadas: IVA 100% (Bs. 57.558,29), ISLR 2% (Bs. 7.194,79), Imp. Municipal 2.5% (Bs. 8.993,48).',
  'TRANSFERENCIA_BS', '0047900004480', '2026-11-04 11:49:31', 'Jarvick', null
);

// 7. Correlativo en settings
db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '305')").run();

console.log('¡Sincronización canónica completada!');

// Verificar resultado
const docs = db.prepare(`
  SELECT doc_number, doc_type, status, payment_status, client_id, control_number, currency, total_amount_currency, subtotal_bs, iva_amount_bs, total_bs_applied, base_usd_bcv, issue_date
  FROM documents 
  WHERE doc_type = 'FORMA_LIBRE' AND doc_number >= 300
  ORDER BY doc_number ASC
`).all();

console.log('Documentos resultantes:');
console.log(JSON.stringify(docs, null, 2));
