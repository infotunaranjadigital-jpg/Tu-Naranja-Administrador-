const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'lib', 'db.ts');
let code = fs.readFileSync(dbPath, 'utf8').replace(/\r\n/g, '\n');

const targetMigration = `  // Emisión y respaldo oficial de Factura Nº 301 para Centro Cerámico García (Forma Libre a tasa Promedio)
  try {
    // 1. Limpiar duplicados de prueba de Mantica del 3 de nov para que quede solo la factura Nº 300 oficial
    db.exec(\`
      DELETE FROM documents 
      WHERE doc_type = 'FORMA_LIBRE' 
        AND client_id = 'mantica' 
        AND issue_date = '2026-11-03' 
        AND id IN ('doc_forma_libre_301', 'doc_forma_libre_300', 'doc_forma_libre_299');
    \`);

    // 2. Comprobar si ya existe la 301 para cc-garcia
    const existingGarcia301 = db.prepare("SELECT id FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 301 AND client_id = 'cc-garcia'").get();
    if (!existingGarcia301) {
      db.prepare("DELETE FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 301").run();

      const rateRow = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
      const bcvRate = Number(rateRow?.bcv_usd || 891.11);
      const avgRate = Number(rateRow?.average_usd || 946.31);
      const appliedRate = avgRate; // Tasa Promedio

      const totalUsd = 170.0;
      const subtotalBs = Number((totalUsd * appliedRate).toFixed(2));
      const ivaBs = Number((subtotalBs * 0.16).toFixed(2));
      const totalBs = Number((subtotalBs + ivaBs).toFixed(2));

      // Retenciones SENIAT (75% IVA y 2% ISLR)
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
          description: 'Jornada de grabación mensual en tienda',
          category: 'GRABACIONES',
          unit: '1.0',
          quantity: 1,
          amount: 30.0
        }
      ];

      const insertStmt = db.prepare(\`
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
      \`);

      insertStmt.run(
        appliedRate, bcvRate,
        subtotalBs, ivaBs, totalBs,
        ivaRetBs, islrRetBs, netPayableBs, netPayableUsd,
        baseBsBcv, baseUsdBcv, JSON.stringify(items)
      );
    }

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', '301');
  } catch (e) {
    console.warn('Error migration doc 301:', e);
  }`;

const newMigration = `  // Ajuste de correlativos: Mantica queda con su Factura 301 y Centro Cerámico García es la Factura 302 con Nº de Control 302
  try {
    // 1. Restaurar / mantener Factura 301 para Mantica
    const mantica301Exists = db.prepare("SELECT id FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 301 AND client_id = 'mantica'").get();
    if (!mantica301Exists) {
      db.prepare("DELETE FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 301").run();
      const insertMantica = db.prepare(\`
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
          'doc_forma_libre_301', 'FORMA_LIBRE', 301, 'mantica', 'J-00059876-2', '2026-11-03', '2026-11-03',
          'EMITTED', 'PENDING', 'USD', 490.0,
          'BCV', 891.11, 891.11,
          436643.90, 0.16, 69863.02, 506506.92,
          1, 75, 52397.27,
          2, 8732.88, 445376.78, 499.80,
          506506.92, 490.0,
          '[{"description":"Manejo de Redes Sociales (noviembre)","category":"MARKETING_RRSS","unit":"1.0","quantity":1,"amount":350},{"description":"Meta ads 100","category":"MARKETING_ADS","unit":"1.0","quantity":1,"amount":100,"categoryManuallySet":true},{"description":"Mes rosa","category":"GRABACIONES","unit":"1.0","quantity":1,"amount":40,"categoryManuallySet":true}]',
          'Factura de Noviembre MANTICA',
          'TRANSFERENCIA_BS', null, null, 'Jarvick', null
        )
      \`);
      insertMantica.run();
    }

    // 2. Factura 302 para Centro Cerámico García (con número de control 302)
    const garcia302Exists = db.prepare("SELECT id FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 302 AND client_id = 'cc-garcia'").get();
    if (!garcia302Exists) {
      db.prepare("DELETE FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 302").run();
      db.prepare("DELETE FROM documents WHERE id = 'doc_forma_libre_302'").run();

      const rateRow = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
      const bcvRate = Number(rateRow?.bcv_usd || 891.11);
      const avgRate = Number(rateRow?.average_usd || 946.31);
      const appliedRate = avgRate; // Tasa Promedio

      const totalUsd = 170.0;
      const subtotalBs = Number((totalUsd * appliedRate).toFixed(2));
      const ivaBs = Number((subtotalBs * 0.16).toFixed(2));
      const totalBs = Number((subtotalBs + ivaBs).toFixed(2));

      // Retenciones SENIAT (75% IVA y 2% ISLR)
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
          description: 'Jornada de grabación mensual en tienda',
          category: 'GRABACIONES',
          unit: '1.0',
          quantity: 1,
          amount: 30.0
        }
      ];

      const insertGarcia = db.prepare(\`
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
          'doc_forma_libre_302', 'FORMA_LIBRE', 302, 'cc-garcia', 'J-31275024-3', '2026-11-03', '2026-11-03',
          'EMITTED', 'PENDING', 'USD', 170.0,
          'PROMEDIO', ?, ?,
          ?, 0.16, ?, ?,
          1, 75, ?,
          2, ?, ?, ?,
          ?, ?, ?, 'Cobro mensualidad noviembre a tasa promedio P2P/BCV + Jornada de grabación',
          'TRANSFERENCIA_BS', null, null, 'Jarvick', '302'
        )
      \`);

      insertGarcia.run(
        appliedRate, bcvRate,
        subtotalBs, ivaBs, totalBs,
        ivaRetBs, islrRetBs, netPayableBs, netPayableUsd,
        baseBsBcv, baseUsdBcv, JSON.stringify(items)
      );
    }

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', '302');
  } catch (e) {
    console.warn('Error migration doc 302:', e);
  }`;

if (!code.includes(targetMigration)) {
  console.error('targetMigration not found!');
  process.exit(1);
}

code = code.replace(targetMigration, newMigration);
fs.writeFileSync(dbPath, code, 'utf8');
console.log('Successfully updated src/lib/db.ts to set CC Garcia as 302 and restore Mantica 301');
