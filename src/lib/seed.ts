import { getDb } from './db';
import crypto from 'node:crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDatabase() {
  const db = getDb();

  // Check if users exist
  const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = (userCountStmt.get() as { count: number }).count;

  if (userCount === 0) {
    console.log('--- SEEDING INITIAL DATABASE ---');

    // 1. Usuarios
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('usr_jarvick', 'jarvick', hashPassword('jarvick2026'), 'Jarvick', 'admin');
    insertUser.run('usr_socia', 'socia', hashPassword('naranja2026'), 'Socia Directora', 'partner');

    // 2. API Key para el Asistente AI
    const insertKey = db.prepare(`
      INSERT INTO api_keys (id, key, name)
      VALUES (?, ?, ?)
    `);
    insertKey.run('key_ai_agent', 'naranja_ai_assistant_key_2026', 'Antigravity AI Agent');

    // 3. Tasas de cambio iniciales
    const today = new Date().toISOString().split('T')[0];
    const insertRate = db.prepare(`
      INSERT OR REPLACE INTO exchange_rates (id, date, bcv_usd, bcv_eur, binance_usdt, average_usd)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const bcvUsd = 888.12;
    const bcvEur = 989.72;
    const binanceUsdt = 1007.00;
    const avgUsd = Number(((bcvUsd + binanceUsdt) / 2).toFixed(2));
    insertRate.run('rate_' + today, today, bcvUsd, bcvEur, binanceUsdt, avgUsd);

    // 4. Configuracion de la empresa
    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('company_name', 'Tu Naranja Digital');
    insertSetting.run('company_phone', '+58 414 154 42 52');
    insertSetting.run('company_email', 'contacto@tunaranjadigital.com');
    insertSetting.run('company_address', 'Caracas, Venezuela, 1010');
    insertSetting.run('bank_account', 'Banco Mercantil Cta Corriente 0105-0638-70-163832743-2');
    insertSetting.run('pago_movil', 'Banco Mercantil 0414-1544252');
    insertSetting.run('last_forma_libre_number', '297');
    insertSetting.run('last_receipt_number', '359');

    // 5. Clientes consolidados de Tu Naranja Digital
    const initialClients = [
      {
        id: "mantica",
        name: "Clinica Leopoldo Aguerrevere (Materno Infantil)",
        business_name: "Materno Infantil C.A (MANTICA)",
        rif: "J-00059876-2",
        phone: "0212-9072222",
        email: "administracion@leopoldoaguerrevere.com",
        address: "Av. Rio Manapire, Urb. Parque Humboldt, Prados del este",
        default_currency: "USD",
        base_monthly_fee: 350.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 5,
        preferred_document: "FORMA_LIBRE",
        notes: "Cliente corporativo. Facturas impresas en forma libre continua."
      },
      {
        id: "feminaid",
        name: "Servicios Feminaid 2021 CA",
        business_name: "Servicios Feminaid 2021 CA",
        rif: "J-50125683-7",
        phone: "0212-9072222",
        email: "feminaid2021@gmail.com",
        address: "Av. Rio Manapire, Edif Centro Clinico de Maternidad Leopoldo Aguerrevere",
        default_currency: "USD",
        base_monthly_fee: 320.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 14,
        preferred_document: "FORMA_LIBRE",
        notes: "Rotulados e impresiones especiales."
      },
      {
        id: "cc-garcia",
        name: "CC Garcia",
        business_name: "Centro Ceramico Garcia I, C.A.",
        rif: "J-31275024-3",
        phone: "0212-4812972",
        email: "centroceramicogarcia@gmail.com",
        address: "Av. San Martin, Albañales a Cruz de la Vega #284",
        default_currency: "USD",
        base_monthly_fee: 150.0,
        meta_ads_budget: 0.0,
        default_rate_type: "PROMEDIO",
        billing_day: 2,
        preferred_document: "FORMA_LIBRE",
        notes: "Tarifa subió a $150 en 2026. +$30 jornada de grabacion."
      },
      {
        id: "sovemo",
        name: "SOVEMO",
        business_name: "SOC. VEN. DE MENOPAUSIA Y OSTEOPOROSIS - SOVEMO",
        rif: "J-30327967-8",
        phone: "+58 414 0108438",
        email: "sovemo.venezuela@gmail.com",
        address: "AV 6TA. TRANSV. DE SAN JUAN BOSCO EDIF CLINICA EL AVILA",
        default_currency: "USD",
        base_monthly_fee: 180.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 24,
        preferred_document: "RECIBO",
        notes: "Tarifa 2026: $180 (anterior $150). Manejo mensual y coberturas de eventos."
      },
      {
        id: "soc-mastologia",
        name: "Sociedad de Mastologia",
        business_name: "Sociedad Venezolana de Mastologia",
        rif: "J-00000000-0",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 240.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 1,
        preferred_document: "RECIBO",
        notes: ""
      },
      {
        id: "soc-oncologia",
        name: "Sociedad Venezolana de Oncologia",
        business_name: "Sociedad Venezolana de Oncologia",
        rif: "J-00000000-0",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 240.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 26,
        preferred_document: "RECIBO",
        notes: "Ajuste 2026 a $240 (anterior $200)."
      },
      {
        id: "dr-gerardo",
        name: "Dr Gerardo",
        business_name: "Dr. Gerardo",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 250.0,
        meta_ads_budget: 120.0,
        default_rate_type: "EFECTIVO",
        billing_day: 1,
        preferred_document: "RECIBO",
        notes: "Pago en $ efectivo. Presupuesto Meta Ads: $120."
      },
      {
        id: "arias-doc",
        name: "Arias DOC",
        business_name: "Arias DOC",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 200.0,
        meta_ads_budget: 100.0,
        default_rate_type: "EURO",
        billing_day: 2,
        preferred_document: "RECIBO",
        notes: "Pago en $ efectivo o a tasa Euro. Meta Ads: $100."
      },
      {
        id: "fototecno",
        name: "FotoTecno",
        business_name: "FotoTecno",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 200.0,
        meta_ads_budget: 0.0,
        default_rate_type: "EFECTIVO",
        billing_day: 15,
        preferred_document: "RECIBO",
        notes: "Pago en $ efectivo."
      },
      {
        id: "dra-virginia",
        name: "Dra Virginia",
        business_name: "Dra. Virginia",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 180.0,
        meta_ads_budget: 0.0,
        default_rate_type: "PROMEDIO",
        billing_day: 20,
        preferred_document: "RECIBO",
        notes: "Tasa promedio."
      },
      {
        id: "english-lab",
        name: "English Lab",
        business_name: "English Lab",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 125.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 10,
        preferred_document: "RECIBO",
        notes: "Ajuste 2026: $125 (anterior $100). Pagos quincenales (50% el 10 y 50% el 25)."
      },
      {
        id: "fetal-care",
        name: "Fetal Care (Dra. Fanny)",
        business_name: "Fetal Care C.A.",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 160.0,
        meta_ads_budget: 0.0,
        default_rate_type: "PROMEDIO",
        billing_day: 28,
        preferred_document: "RECIBO",
        notes: "Tasa promedio."
      },
      {
        id: "dra-fanny-toro",
        name: "Dra Fanny Toro",
        business_name: "Dra. Fanny Toro",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 100.0,
        meta_ads_budget: 0.0,
        default_rate_type: "PROMEDIO",
        billing_day: 28,
        preferred_document: "RECIBO",
        notes: "Tasa promedio."
      },
      {
        id: "jesus-elbittar",
        name: "Jesus Elbittar",
        business_name: "Jesus Elbittar",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 80.0,
        meta_ads_budget: 0.0,
        default_rate_type: "PROMEDIO",
        billing_day: 15,
        preferred_document: "RECIBO",
        notes: "Tasa promedio."
      },
      {
        id: "los-rosales",
        name: "Autorepuesto Los Rosales",
        business_name: "Autorepuestos Los Rosales C.A.",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 200.0,
        meta_ads_budget: 0.0,
        default_rate_type: "EFECTIVO",
        billing_day: 1,
        preferred_document: "RECIBO",
        notes: "Pago en $ efectivo (100 de Isa)."
      },
      {
        id: "calibre",
        name: "Calibre",
        business_name: "Calibre",
        rif: "",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 180.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BINANCE",
        billing_day: 20,
        preferred_document: "RECIBO",
        notes: "Pago internacional / PayPal / Binance."
      }
    ];

    const insertClient = db.prepare(`
      INSERT OR REPLACE INTO clients (
        id, name, business_name, rif, phone, email, address,
        default_currency, base_monthly_fee, meta_ads_budget,
        default_rate_type, billing_day, preferred_document, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of initialClients) {
      insertClient.run(
        c.id, c.name, c.business_name || c.name, c.rif || '',
        c.phone || '', c.email || '', c.address || '',
        c.default_currency || 'USD', c.base_monthly_fee || 0,
        c.meta_ads_budget || 0, c.default_rate_type || 'BCV',
        c.billing_day || 1, c.preferred_document || 'RECIBO',
        c.notes || ''
      );
    }
    console.log(`Seeded ${initialClients.length} clients.`);

    // 6. Equipo real de Tu Naranja Digital
    syncCanonicalTeam();

    // 7. Documentos historicos de ejemplo
    const insertDoc = db.prepare(`
      INSERT OR REPLACE INTO documents (
        id, doc_type, doc_number, client_id, issue_date, due_date,
        status, payment_status, currency, total_amount_currency,
        rate_type_applied, applied_rate, bcv_rate_at_issue,
        subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
        base_bs_bcv, base_usd_bcv, items_json, notes, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      'doc_297', 'FORMA_LIBRE', 297, 'feminaid', '2026-10-14', '2026-10-14',
      'PAID', 'PAID', 'USD', 60.0,
      'BCV', 863.12, 863.12,
      51787.32, 0.16, 8285.97, 60073.29,
      60073.29, 69.60,
      JSON.stringify([{
        description: 'Impresion e instalacion rotulados para (100 pulseras)',
        unit: '1.0',
        quantity: 1,
        unitPrice: 51787.32,
        amount: 51787.32
      }]),
      'Factura cancelada y entregada', 'TRANSFERENCIA_BS'
    );

    insertDoc.run(
      'doc_359', 'RECIBO', 359, 'sovemo', '2026-10-23', '2026-10-30',
      'EMITTED', 'PAID', 'USD', 180.0,
      'BCV', 738.51, 738.51,
      132933.00, 0, 0, 132933.00,
      132933.00, 180.0,
      JSON.stringify([{
        description: 'Manejo de rrss Noviembre',
        unit: 'Servicio',
        quantity: 1,
        unitPrice: 132933.00,
        amount: 132933.00
      }]),
      'Recibo digital emitido', 'TRANSFERENCIA_BS'
    );

    console.log('Initial database setup complete.');
  }

  // Siempre sincronizar el equipo canónico actualizado sin duplicados
  syncCanonicalTeam();
  // Sincronizar listado oficial de RIFs de clientes
  syncCanonicalClients();
}

export function syncCanonicalTeam() {
  const db = getDb();

  try {
    // Reasignar pagos si hubiese de IDs previos
    db.exec(`
      UPDATE team_payments SET member_id = 'tm_isabelle' 
      WHERE member_id IN ('tm_ysael', 'tm_1793216982099')
    `);
    db.exec(`
      UPDATE team_payments SET member_id = 'tm_adis' 
      WHERE member_id IN ('tm_1793216982473')
    `);
    db.exec(`
      UPDATE team_payments SET member_id = 'tm_angie' 
      WHERE member_id IN ('tm_1793216981914')
    `);
    db.exec(`
      UPDATE team_payments SET member_id = 'tm_eleonora' 
      WHERE member_id IN ('tm_1793216981737')
    `);
    db.exec(`
      UPDATE team_payments SET member_id = 'tm_mariana' 
      WHERE member_id IN ('tm_1793216982288')
    `);

    // Eliminar IDs no canónicos o duplicados
    db.exec(`
      DELETE FROM team_members 
      WHERE id NOT IN ('tm_isabelle', 'tm_angie', 'tm_adis', 'tm_mariana', 'tm_eleonora');
    `);
  } catch (e) {
    console.warn('Error during team cleanup:', e);
  }

  const canonicalTeam = [
    {
      id: 'tm_isabelle',
      name: 'Isabelle',
      role: 'Community Manager & Redacción',
      monthly_salary: 240,
      payment_method: 'PAGO_MOVIL',
      payment_frequency: 'QUINCENAL',
      rate_rule: 'EURO_INCENTIVE',
      incentive_rule: 'Incentivo a Tasa Euro cuando hace todo bien, sino a Tasa BCV.',
      notes: '$240/mes ($120 quincenal). Tasa regular BCV; si cumple objetivos se le paga a tasa Euro como incentivo.'
    },
    {
      id: 'tm_angie',
      name: 'Angie',
      role: 'Diseño & Contenido',
      monthly_salary: 240,
      payment_method: 'PAGO_MOVIL',
      payment_frequency: 'QUINCENAL',
      rate_rule: 'BCV',
      incentive_rule: 'Base $200 + bono incentivo $40 = $240 a tasa BCV.',
      notes: 'Normalmente gana $240 a tasa BCV ($120 quincenal).'
    },
    {
      id: 'tm_adis',
      name: 'Adis',
      role: 'Diseño & Audiovisual',
      monthly_salary: 300,
      payment_method: 'PAGO_MOVIL',
      payment_frequency: 'QUINCENAL',
      rate_rule: 'BCV',
      incentive_rule: 'Pago regular a tasa oficial BCV.',
      notes: '$300/mes ($150 quincenal) a tasa oficial BCV.'
    },
    {
      id: 'tm_mariana',
      name: 'Mariana',
      role: 'Estrategia & Contenido',
      monthly_salary: 300,
      payment_method: 'PAGO_MOVIL',
      payment_frequency: 'QUINCENAL',
      rate_rule: 'BCV',
      incentive_rule: 'Pago regular a tasa oficial BCV.',
      notes: '$300/mes ($150 quincenal) a tasa oficial BCV.'
    },
    {
      id: 'tm_eleonora',
      name: 'Eleonora',
      role: 'Especialista & Coordinación',
      monthly_salary: 60,
      payment_method: 'BINANCE',
      payment_frequency: 'QUINCENAL',
      rate_rule: 'BINANCE',
      incentive_rule: 'Pago acordado exclusivamente en Binance USDT ($60/mes).',
      notes: '$60/mes ($30 quincenal) a tasa Binance. Cobro exclusivo por Binance USDT.'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO team_members (
      id, name, role, monthly_salary, payment_method, payment_frequency, rate_rule, incentive_rule, notes, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role,
      monthly_salary = excluded.monthly_salary,
      payment_method = excluded.payment_method,
      payment_frequency = excluded.payment_frequency,
      rate_rule = excluded.rate_rule,
      incentive_rule = excluded.incentive_rule,
      notes = excluded.notes,
      active = 1
  `);

  for (const m of canonicalTeam) {
    stmt.run(
      m.id, m.name, m.role, m.monthly_salary,
      m.payment_method, m.payment_frequency,
      m.rate_rule, m.incentive_rule, m.notes
    );
  }
  console.log('Canonical team synchronized: Isabelle, Angie, Adis, Mariana, Eleonora.');
}

export function syncCanonicalClients() {
  const db = getDb();
  
  // Mapeo oficial de RIFs extraídos del Listado Oficial del cliente
  const updates: Record<string, { rif: string; business_name?: string }> = {
    'sovemo': { rif: 'J-30327967-8', business_name: 'SOC. VEN. DE MENOPAUSIA Y OSTEOPOROSIS - SOVEMO' },
    'english-lab': { rif: 'J-30707830-8', business_name: 'English Lab' },
    'mantica': { rif: 'J-00059876-2', business_name: 'Materno Infantil C.A (MANTICA)' },
    'cc-garcia': { rif: 'J-31275024-3, J-31273093-5', business_name: 'Centro Ceramico Garcia I, C.A.' },
    'soc-oncologia': { rif: 'J-00257350-3', business_name: 'Sociedad Venezolana de Oncologia (SVO)' },
    'soc-mastologia': { rif: 'J-00331364-5', business_name: 'Sociedad Venezolana de Mastologia (SVM)' },
    'fototecno': { rif: 'J-50765898-2', business_name: 'FotoTecno' },
    'dra-virginia': { rif: 'V-06820047-0', business_name: 'Dra. Virginia' },
    'arias-doc': { rif: 'V-11312990-1, V-06625245-7, V-03120276-7', business_name: 'Arias DOC' },
    'dra-fanny-toro': { rif: 'V-13872720-0', business_name: 'Dra. Fanny Toro' },
    'dr-gerardo': { rif: 'V-9486579-0', business_name: 'Dr. Gerardo' },
    'los-rosales': { rif: 'J-50706696-7', business_name: 'Autorepuestos Los Rosales C.A.' },
    'fetal-care': { rif: '', business_name: 'Fetal Care C.A. (Sin RIF)' },
    'feminaid': { rif: 'J-50125683-7', business_name: 'Servicios Feminaid 2021 CA' }
  };

  const updateStmt = db.prepare('UPDATE clients SET rif = ?, business_name = COALESCE(?, business_name) WHERE id = ?');
  for (const [id, data] of Object.entries(updates)) {
    updateStmt.run(data.rif, data.business_name || null, id);
  }

  // Odontólogo / Arinita (Convenio especial con ambos RIFs)
  const arianita = db.prepare('SELECT id FROM clients WHERE id = ?').get('arianita');
  if (arianita) {
    updateStmt.run('V-15200632-9, J-50811817-0', 'Odontólogo / Arinita', 'arianita');
  } else {
    db.prepare(`
      INSERT INTO clients (
        id, name, business_name, rif, phone, email, address,
        default_currency, base_monthly_fee, meta_ads_budget,
        default_rate_type, billing_day, preferred_document, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'arianita', 'Odontólogo / Arinita', 'Odontólogo / Arinita', 'V-15200632-9, J-50811817-0',
      '', '', 'Caracas, Venezuela',
      'USD', 170.0, 0, 'BCV', 1, 'RECIBO', 'Convenio especial Odontólogo / Arinita.'
    );
  }

  // Dra DAMA
  const draDama = db.prepare('SELECT id FROM clients WHERE id = ?').get('dra-dama');
  if (draDama) {
    updateStmt.run('V-13721648-1', 'Dra. Dama', 'dra-dama');
  } else {
    db.prepare(`
      INSERT INTO clients (
        id, name, business_name, rif, phone, email, address,
        default_currency, base_monthly_fee, meta_ads_budget,
        default_rate_type, billing_day, preferred_document, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'dra-dama', 'Dra DAMA', 'Dra. Dama', 'V-13721648-1',
      '', '', 'Caracas, Venezuela',
      'USD', 150.0, 0, 'BCV', 1, 'RECIBO', 'Cliente médico.'
    );
  }

  console.log('Canonical clients RIFs synchronized successfully.');
}
