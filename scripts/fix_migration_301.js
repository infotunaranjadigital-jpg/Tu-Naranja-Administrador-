const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'src', 'lib', 'db.ts');
let code = fs.readFileSync(dbPath, 'utf8').replace(/\r\n/g, '\n');

// Replace the previous doc 301 block with a clean, definitive setup
const oldDoc301Block = `  // Emisión y respaldo de Factura Nº 301 para Centro Cerámico García (Forma Libre a tasa Promedio)
  try {
    const existing301 = db.prepare("SELECT id FROM documents WHERE doc_type = 'FORMA_LIBRE' AND doc_number = 301").get();
    if (!existing301) {
      const today = '2026-11-03';
      const rateRow = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
      const bcvRate = Number(rateRow?.bcv_usd || 891.11);
      const avgRate = Number(rateRow?.average_usd || 946.31);
      const appliedRate = avgRate; // Tasa Promedio

      const totalUsd = 170.0;
      const subtotalBs = Number((totalUsd * appliedRate).toFixed(2));
      const ivaBs = Number((subtotalBs * 0.16).toFixed(2));
      const totalBs = Number((subtotalBs + ivaBs).toFixed(2));

      // Retenciones 75% IVA y 2% ISLR
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

      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', '301');
    }
  } catch (e) {
    console.warn('Error migration doc 301:', e);
  }
}`;

const newDoc301Block = `  // Emisión y respaldo oficial de Factura Nº 301 para Centro Cerámico García (Forma Libre a tasa Promedio)
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

if (!code.includes(oldDoc301Block)) {
  console.error('oldDoc301Block not found in db.ts!');
  process.exit(1);
}

code = code.replace(oldDoc301Block, newDoc301Block);
fs.writeFileSync(dbPath, code, 'utf8');
console.log('Successfully updated migration in src/lib/db.ts');
