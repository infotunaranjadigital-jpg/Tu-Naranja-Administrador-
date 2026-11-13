const fs = require('fs');
const path = require('path');

// 1. Update src/lib/db.ts
const dbPath = path.join(__dirname, '..', 'src', 'lib', 'db.ts');
let dbCode = fs.readFileSync(dbPath, 'utf8').replace(/\r\n/g, '\n');

const migrationRegex = /\/\/ Ajuste de correlativos:[\s\S]*?db\.prepare\('INSERT OR REPLACE INTO settings[\s\S]*?\}\s*\}\s*$/;

const cleanMigration = `  // Limpieza y sincronización canónica de Facturas Forma Libre (Noviembre 2026):
  // Factura 300: MANTICA ($490 USD, Tasa 889.58 BCV -> Subtotal: 435.894,20 Bs, IVA: 69.743,07 Bs, Total: 505.637,27 Bs)
  // Factura 301: Centro Cerámico García ($170 USD, Tasa 946.31 Promedio -> Total: 186.612,33 Bs, Nº de Control: 302)
  try {
    db.exec(\`
      DELETE FROM documents 
      WHERE doc_type = 'FORMA_LIBRE' 
        AND issue_date >= '2026-11-01' 
        AND id IN ('doc_forma_libre_298', 'doc_forma_libre_299', 'doc_forma_libre_300', 'doc_forma_libre_301', 'doc_forma_libre_302');
    \`);

    const insertDoc = db.prepare(\`
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
    \`);

    // 1. Factura 300: MANTICA (Idéntica al PDF oficial)
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

    // 2. Factura 301: Centro Cerámico García (con Nº de Control SENIAT 302)
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

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '301')").run();
  } catch (e) {
    console.warn('Error migration November Forma Libre:', e);
  }
}
`;

dbCode = dbCode.replace(migrationRegex, cleanMigration);
fs.writeFileSync(dbPath, dbCode, 'utf8');
console.log('Updated src/lib/db.ts');

// 2. Update src/components/FormaLibrePrint.tsx to fix blank page 2 in print
const printPath = path.join(__dirname, '..', 'src', 'components', 'FormaLibrePrint.tsx');
let printCode = fs.readFileSync(printPath, 'utf8').replace(/\r\n/g, '\n');

const oldStyle = `@media print {
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\\\:hidden {
              display: none !important;
            }
            @page {
              size: letter;
              margin: 0;
            }
          }`;

const newStyle = `@media print {
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              height: 279mm !important;
              overflow: hidden !important;
            }
            .print\\\\:hidden {
              display: none !important;
            }
            @page {
              size: letter;
              margin: 0;
            }
          }`;

printCode = printCode.replace(oldStyle, newStyle);

const oldDiv = `className="relative w-[216mm] min-h-[279mm] pt-[50mm] px-[15mm] pb-[15mm] text-[12px] font-sans"`;
const newDiv = `className="relative w-[216mm] h-[279mm] max-h-[279mm] box-border pt-[50mm] px-[15mm] pb-[10mm] text-[12px] font-sans overflow-hidden"`;

printCode = printCode.replace(oldDiv, newDiv);

const oldMinH = `min-h-[110mm]`;
const newMinH = `min-h-[90mm]`;
printCode = printCode.replace(oldMinH, newMinH);

fs.writeFileSync(printPath, printCode, 'utf8');
console.log('Updated src/components/FormaLibrePrint.tsx');
