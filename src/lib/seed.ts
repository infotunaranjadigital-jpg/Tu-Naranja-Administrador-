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
        rif: "J-31275024-3, J-31273093-5",
        phone: "0212-4812972",
        email: "centroceramicogarcia@gmail.com",
        address: "Av. San Martin, Albañales a Cruz de la Vega #284",
        default_currency: "USD",
        base_monthly_fee: 170.0,
        meta_ads_budget: 0.0,
        default_rate_type: "PROMEDIO",
        billing_day: 2,
        preferred_document: "FORMA_LIBRE",
        notes: "Tarifa $170 ($140 manejo mensual + $30 grabaciones). Agente de Retención SENIAT (75% IVA y 2% ISLR)."
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
        base_monthly_fee: 150.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 24,
        preferred_document: "RECIBO",
        notes: "Tarifa 2026: $150 a tasa oficial BCV."
      },
      {
        id: "soc-mastologia",
        name: "Sociedad de Mastologia",
        business_name: "Sociedad Venezolana de Mastologia",
        rif: "J-00331364-5",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 240.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 1,
        preferred_document: "FORMA_LIBRE",
        notes: "Emisión en Factura Forma Libre (+16% IVA). Retención SENIAT opcional/por verificar."
      },
      {
        id: "soc-oncologia",
        name: "Sociedad Venezolana de Oncologia",
        business_name: "Sociedad Venezolana de Oncologia",
        rif: "J-00257350-3",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 240.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 26,
        preferred_document: "FORMA_LIBRE",
        notes: "Emisión en Factura Forma Libre (+16% IVA). Retención SENIAT opcional/por verificar."
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
        rif: "J-30707830-8",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 100.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 10,
        preferred_document: "RECIBO",
        notes: "Tarifa mensual de $100."
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
        default_rate_type: "PAYPAL",
        billing_day: 20,
        preferred_document: "RECIBO",
        notes: "Pago acordado mensual a través de PayPal."
      },
      {
        id: "dra-dama",
        name: "Dra DAMA",
        business_name: "Dra. Dama",
        rif: "V-13721648-1",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 250.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 1,
        preferred_document: "RECIBO",
        notes: "Cliente médico. Tarifa actualizada a $250/mes."
      },
      {
        id: "arinita",
        name: "Arinita",
        business_name: "Arinita",
        rif: "J-50811817-0",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 170.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 1,
        preferred_document: "RECIBO",
        notes: "Acuerdo de intercambio ($170 en mercancía). Los 2 reciben $85 en mercancía cada uno ($85 Isa / $85 Agencia). Sin pago en dinero a Isabelle."
      },
      {
        id: "odontologo-rony",
        name: "Odontólogo (Dr. Rony)",
        business_name: "Odontólogo (Dr. Rony)",
        rif: "V-15200632-9",
        phone: "",
        email: "",
        address: "Caracas, Venezuela",
        default_currency: "USD",
        base_monthly_fee: 250.0,
        meta_ads_budget: 0.0,
        default_rate_type: "BCV",
        billing_day: 1,
        preferred_document: "RECIBO",
        notes: "Acuerdo por $250. De este cliente se le pagan $100 a Isabelle a tasa oficial BCV (Neto Agencia: $150)."
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
  // Sincronizar documentos históricos categorizados para gráficos de áreas de ingreso
  syncHistoricalDocuments();
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
  
  // Mapeo oficial y sincronización de clientes con tarifas actualizadas y reglas SENIAT
  const clientConfigs: Record<string, { 
    name?: string;
    business_name?: string;
    rif: string; 
    base_monthly_fee?: number;
    default_rate_type?: string;
    preferred_document?: string;
    notes?: string;
    is_withholding_agent?: number;
    iva_retention_percent?: number;
    islr_retention_percent?: number;
  }> = {
    'sovemo': { 
      name: 'SOVEMO',
      business_name: 'SOC. VEN. DE MENOPAUSIA Y OSTEOPOROSIS - SOVEMO',
      rif: 'J-30327967-8', 
      base_monthly_fee: 150.0,
      default_rate_type: 'BCV',
      notes: 'Tarifa mensual de $150 a tasa oficial BCV.' 
    },
    'english-lab': { 
      rif: 'J-30707830-8', 
      business_name: 'English Lab',
      base_monthly_fee: 100.0,
      notes: 'Tarifa mensual de $100.'
    },
    'mantica': { 
      name: 'Clinica Leopoldo Aguerrevere (Materno Infantil)',
      rif: 'J-00059876-2', 
      business_name: 'Materno Infantil C.A (MANTICA)',
      base_monthly_fee: 350.0,
      notes: 'Agente de Retención (SENIAT). Facturación en Forma Libre con retención de 75% IVA y 2% ISLR.',
      is_withholding_agent: 1,
      iva_retention_percent: 75,
      islr_retention_percent: 2
    },
    'cc-garcia': { 
      name: 'CC Garcia',
      rif: 'J-31275024-3, J-31273093-5', 
      business_name: 'Centro Ceramico Garcia I, C.A.',
      base_monthly_fee: 170.0, // $140 mensual + $30 grabaciones
      notes: 'Tarifa $170 ($140 manejo mensual + $30 de grabaciones). Agente de Retención SENIAT (75% IVA y 2% ISLR en Forma Libre).',
      is_withholding_agent: 1,
      iva_retention_percent: 75,
      islr_retention_percent: 2
    },
    'calibre': {
      name: 'Calibre',
      rif: '',
      base_monthly_fee: 180.0,
      default_rate_type: 'PAYPAL',
      preferred_document: 'RECIBO',
      notes: 'Pago mensual de $180 procesado a través de PayPal.'
    },
    'dra-dama': {
      name: 'Dra DAMA',
      business_name: 'Dra. Dama',
      rif: 'V-13721648-1',
      base_monthly_fee: 250.0,
      default_rate_type: 'BCV',
      notes: 'Cliente médico. Tarifa actualizada a $250/mes.'
    },
    'soc-oncologia': { 
      rif: 'J-00257350-3', 
      business_name: 'Sociedad Venezolana de Oncologia (SVO)',
      base_monthly_fee: 240.0,
      preferred_document: 'FORMA_LIBRE',
      notes: 'Factura fiscal Forma Libre (+16% IVA). Retención SENIAT opcional/por confirmar.'
    },
    'soc-mastologia': { 
      rif: 'J-00331364-5', 
      business_name: 'Sociedad Venezolana de Mastologia (SVM)',
      base_monthly_fee: 240.0,
      preferred_document: 'FORMA_LIBRE',
      notes: 'Factura fiscal Forma Libre (+16% IVA). Retención SENIAT opcional/por confirmar.'
    },
    'fototecno': { 
      rif: 'J-50765898-2', 
      business_name: 'FotoTecno',
      base_monthly_fee: 200.0
    },
    'dra-virginia': { 
      rif: 'V-06820047-0', 
      business_name: 'Dra. Virginia',
      base_monthly_fee: 180.0
    },
    'arias-doc': { 
      rif: 'V-11312990-1, V-06625245-7, V-03120276-7', 
      business_name: 'Arias DOC',
      base_monthly_fee: 200.0
    },
    'dra-fanny-toro': { 
      rif: 'V-13872720-0', 
      business_name: 'Dra. Fanny Toro',
      base_monthly_fee: 100.0
    },
    'dr-gerardo': { 
      rif: 'V-9486579-0', 
      business_name: 'Dr. Gerardo',
      base_monthly_fee: 250.0
    },
    'los-rosales': { 
      rif: 'J-50706696-7', 
      business_name: 'Autorepuestos Los Rosales C.A.',
      base_monthly_fee: 200.0,
      notes: 'Cliente compartido con Isabelle. Cobro $200 en efectivo: $100 corresponden a Isa y $100 a la agencia.'
    },
    'fetal-care': { rif: '', business_name: 'Fetal Care C.A. (Sin RIF)', base_monthly_fee: 160.0 },
    'feminaid': { rif: 'J-50125683-7', business_name: 'Servicios Feminaid 2021 CA', base_monthly_fee: 320.0 }
  };

  const updateStmt = db.prepare(`
    UPDATE clients 
    SET rif = ?, 
        name = COALESCE(?, name),
        business_name = COALESCE(?, business_name), 
        notes = COALESCE(?, notes),
        base_monthly_fee = COALESCE(?, base_monthly_fee),
        default_rate_type = COALESCE(?, default_rate_type),
        preferred_document = COALESCE(?, preferred_document),
        is_withholding_agent = COALESCE(?, is_withholding_agent),
        iva_retention_percent = COALESCE(?, iva_retention_percent),
        islr_retention_percent = COALESCE(?, islr_retention_percent)
    WHERE id = ?
  `);

  const insertClientStmt = db.prepare(`
    INSERT INTO clients (
      id, name, business_name, rif, phone, email, address,
      default_currency, base_monthly_fee, meta_ads_budget,
      default_rate_type, billing_day, preferred_document, notes,
      is_withholding_agent, iva_retention_percent, islr_retention_percent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const [id, data] of Object.entries(clientConfigs)) {
    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (existing) {
      updateStmt.run(
        data.rif, 
        data.name || null,
        data.business_name || null, 
        data.notes || null, 
        data.base_monthly_fee !== undefined ? data.base_monthly_fee : null,
        data.default_rate_type || null,
        data.preferred_document || null,
        data.is_withholding_agent !== undefined ? data.is_withholding_agent : null,
        data.iva_retention_percent !== undefined ? data.iva_retention_percent : null,
        data.islr_retention_percent !== undefined ? data.islr_retention_percent : null,
        id
      );
    } else {
      insertClientStmt.run(
        id, data.name || id, data.business_name || data.name || id, data.rif,
        '', '', 'Caracas, Venezuela', 'USD', data.base_monthly_fee || 0, 0,
        data.default_rate_type || 'BCV', 1, data.preferred_document || 'RECIBO',
        data.notes || '', data.is_withholding_agent || 0,
        data.iva_retention_percent || 0, data.islr_retention_percent || 0
      );
    }
  }

  // 1. Separar definitivamente los 2 acuerdos (NO LIGARLOS):
  // Eliminar el antiguo registro fusionado 'arianita' o 'Odontólogo / Arinita'
  db.exec(`DELETE FROM clients WHERE id = 'arianita' OR name LIKE '%Odontólogo / Arinita%'`);

  // A. Cliente: Arinita (Fee $170, RIF J-50811817-0, compartido con Isabelle)
  const arinitaExists = db.prepare('SELECT id FROM clients WHERE id = ?').get('arinita');
  if (arinitaExists) {
    db.prepare(`
      UPDATE clients SET 
        name = 'Arinita',
        business_name = 'Arinita',
        rif = 'J-50811817-0',
        base_monthly_fee = 170.0,
        default_rate_type = 'BCV',
        notes = 'Acuerdo de intercambio ($170 en mercancía). Los 2 reciben $85 en mercancía cada uno ($85 Isa / $85 Agencia). Sin pago en dinero a Isabelle.'
      WHERE id = 'arinita'
    `).run();
  } else {
    insertClientStmt.run(
      'arinita', 'Arinita', 'Arinita', 'J-50811817-0',
      '', '', 'Caracas, Venezuela', 'USD', 170.0, 0, 'BCV', 1, 'RECIBO',
      'Acuerdo de intercambio ($170 en mercancía). Los 2 reciben $85 en mercancía cada uno ($85 Isa / $85 Agencia). Sin pago en dinero a Isabelle.',
      0, 0, 0
    );
  }

  // B. Cliente: Odontólogo (Dr. Rony) (Fee $250, RIF V-15200632-9, acuerdo $250, $100 a Isabelle a BCV)
  const ronyExists = db.prepare('SELECT id FROM clients WHERE id = ?').get('odontologo-rony');
  if (ronyExists) {
    db.prepare(`
      UPDATE clients SET 
        name = 'Odontólogo (Dr. Rony)',
        business_name = 'Odontólogo (Dr. Rony)',
        rif = 'V-15200632-9',
        base_monthly_fee = 250.0,
        default_rate_type = 'BCV',
        notes = 'Acuerdo por $250. De este cliente se le pagan $100 a Isabelle a tasa oficial BCV (Neto Agencia: $150).'
      WHERE id = 'odontologo-rony'
    `).run();
  } else {
    insertClientStmt.run(
      'odontologo-rony', 'Odontólogo (Dr. Rony)', 'Odontólogo (Dr. Rony)', 'V-15200632-9',
      '', '', 'Caracas, Venezuela', 'USD', 250.0, 0, 'BCV', 1, 'RECIBO',
      'Acuerdo por $250. De este cliente se le pagan $100 a Isabelle a tasa oficial BCV (Neto Agencia: $150).',
      0, 0, 0
    );
  }

  // 2. "Asume partimos de este mes y todo el que tenía vencido su mensualidad ya pagó":
  // Marcar como PAID todos los documentos pendientes para arrancar solventes
  db.exec(`
    UPDATE documents 
    SET payment_status = 'PAID', 
        paid_at = COALESCE(paid_at, issue_date) 
    WHERE payment_status = 'PENDING'
  `);

  console.log('Canonical clients, fees, separate agreements and debts synchronized successfully.');
}

export function syncHistoricalDocuments() {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };

  if (countRow.count <= 2) {
    console.log('Seeding rich historical categorized documents (May - Oct 2026)...');
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO documents (
        id, doc_type, doc_number, client_id, issue_date, due_date,
        status, payment_status, currency, total_amount_currency,
        rate_type_applied, applied_rate, bcv_rate_at_issue,
        subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
        base_bs_bcv, base_usd_bcv, items_json, notes, payment_method, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const historical = [
      // MAYO 2026
      { id: 'doc_2026_05_01', type: 'FORMA_LIBRE', num: 280, client: 'mantica', date: '2026-05-05', rate: 450, total: 350, items: [
        { description: 'Manejo integral de redes sociales - Mayo', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 350 }
      ]},
      { id: 'doc_2026_05_02', type: 'RECIBO', num: 340, client: 'dr-gerardo', date: '2026-05-01', rate: 450, total: 370, items: [
        { description: 'Manejo de Redes Sociales y Contenido', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 },
        { description: 'Pauta Publicitaria Meta Ads (Facebook e Instagram)', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 120 }
      ]},
      { id: 'doc_2026_05_03', type: 'RECIBO', num: 341, client: 'arias-doc', date: '2026-05-02', rate: 485, total: 300, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 200 },
        { description: 'Campaña Meta Ads Tráfico & Mensajes', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 100 }
      ]},
      { id: 'doc_2026_05_04', type: 'FORMA_LIBRE', num: 281, client: 'cc-garcia', date: '2026-05-02', rate: 470, total: 170, items: [
        { description: 'Manejo mensual de redes sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 140 },
        { description: 'Jornada de grabación presencial en tienda', category: 'GRABACIONES', unit: 'Jornada', quantity: 1, amount: 30 }
      ]},
      { id: 'doc_2026_05_05', type: 'RECIBO', num: 342, client: 'soc-mastologia', date: '2026-05-15', rate: 450, total: 240, items: [
        { description: 'Manejo de Redes Sociales Institucional', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 240 }
      ]},
      { id: 'doc_2026_05_06', type: 'RECIBO', num: 343, client: 'english-lab', date: '2026-05-20', rate: 450, total: 500, items: [
        { description: 'Diseño y Desarrollo de Landing Page Web', category: 'DESARROLLO', unit: 'Proyecto', quantity: 1, amount: 500 }
      ]},

      // JUNIO 2026 (Pico por Desarrollo de Software)
      { id: 'doc_2026_06_01', type: 'RECIBO', num: 344, client: 'calibre', date: '2026-06-10', rate: 520, total: 2500, items: [
        { description: 'Desarrollo de Software a Medida y Módulos Web', category: 'DESARROLLO', unit: 'Sistema', quantity: 1, amount: 2500 }
      ]},
      { id: 'doc_2026_06_02', type: 'FORMA_LIBRE', num: 282, client: 'mantica', date: '2026-06-05', rate: 520, total: 350, items: [
        { description: 'Manejo integral de redes sociales - Junio', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 350 }
      ]},
      { id: 'doc_2026_06_03', type: 'FORMA_LIBRE', num: 283, client: 'feminaid', date: '2026-06-14', rate: 520, total: 470, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 320 },
        { description: 'Rotulados y material impreso para instalaciones clínicas', category: 'MATERIAL_IMPRESO', unit: 'Producción', quantity: 1, amount: 150 }
      ]},
      { id: 'doc_2026_06_04', type: 'RECIBO', num: 345, client: 'dr-gerardo', date: '2026-06-01', rate: 520, total: 370, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 },
        { description: 'Presupuesto Pauta Publicitaria Meta Ads', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 120 }
      ]},
      { id: 'doc_2026_06_05', type: 'RECIBO', num: 346, client: 'sovemo', date: '2026-06-24', rate: 520, total: 330, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 150 },
        { description: 'Cobertura audiovisual y rodaje de jornada médica', category: 'GRABACIONES', unit: 'Cobertura', quantity: 1, amount: 180 }
      ]},

      // JULIO 2026
      { id: 'doc_2026_07_01', type: 'FORMA_LIBRE', num: 284, client: 'mantica', date: '2026-07-05', rate: 610, total: 350, items: [
        { description: 'Manejo de redes sociales - Julio', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 350 }
      ]},
      { id: 'doc_2026_07_02', type: 'RECIBO', num: 347, client: 'soc-oncologia', date: '2026-07-12', rate: 610, total: 450, items: [
        { description: 'Taller de Formación y Estrategia de Marca Médica', category: 'FORMACION', unit: 'Taller', quantity: 1, amount: 450 }
      ]},
      { id: 'doc_2026_07_03', type: 'RECIBO', num: 348, client: 'dr-gerardo', date: '2026-07-01', rate: 610, total: 370, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 },
        { description: 'Pauta Meta Ads', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 120 }
      ]},
      { id: 'doc_2026_07_04', type: 'RECIBO', num: 349, client: 'arias-doc', date: '2026-07-02', rate: 650, total: 300, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 200 },
        { description: 'Meta Ads Pauta', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 100 }
      ]},
      { id: 'doc_2026_07_05', type: 'FORMA_LIBRE', num: 285, client: 'cc-garcia', date: '2026-07-02', rate: 630, total: 170, items: [
        { description: 'Manejo mensual redes', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 140 },
        { description: 'Jornada de grabación mensual', category: 'GRABACIONES', unit: 'Jornada', quantity: 1, amount: 30 }
      ]},
      { id: 'doc_2026_07_06', type: 'RECIBO', num: 350, client: 'los-rosales', date: '2026-07-15', rate: 610, total: 340, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 200 },
        { description: 'Pendones y material publicitario impreso', category: 'MATERIAL_IMPRESO', unit: 'Impresos', quantity: 1, amount: 140 }
      ]},

      // AGOSTO 2026
      { id: 'doc_2026_08_01', type: 'FORMA_LIBRE', num: 286, client: 'mantica', date: '2026-08-05', rate: 720, total: 350, items: [
        { description: 'Manejo de redes sociales - Agosto', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 350 }
      ]},
      { id: 'doc_2026_08_02', type: 'RECIBO', num: 351, client: 'calibre', date: '2026-08-15', rate: 720, total: 850, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 180 },
        { description: 'Desarrollo de Software y Módulos Web Adicionales', category: 'DESARROLLO', unit: 'Módulos', quantity: 1, amount: 670 }
      ]},
      { id: 'doc_2026_08_03', type: 'RECIBO', num: 352, client: 'dr-gerardo', date: '2026-08-01', rate: 720, total: 370, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 },
        { description: 'Pauta Publicitaria Meta Ads', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 120 }
      ]},
      { id: 'doc_2026_08_04', type: 'RECIBO', num: 353, client: 'fototecno', date: '2026-08-20', rate: 720, total: 380, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 200 },
        { description: 'Cobertura de grabación en estudio fotográfico', category: 'GRABACIONES', unit: 'Grabación', quantity: 1, amount: 180 }
      ]},
      { id: 'doc_2026_08_05', type: 'FORMA_LIBRE', num: 287, client: 'cc-garcia', date: '2026-08-02', rate: 750, total: 170, items: [
        { description: 'Manejo mensual redes sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 140 },
        { description: 'Jornada de grabación mensual', category: 'GRABACIONES', unit: 'Jornada', quantity: 1, amount: 30 }
      ]},
      { id: 'doc_2026_08_06', type: 'RECIBO', num: 354, client: 'dra-virginia', date: '2026-08-20', rate: 750, total: 330, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 180 },
        { description: 'Branding e Identidad Visual de Marca', category: 'MARKETING_OTROS', unit: 'Branding', quantity: 1, amount: 150 }
      ]},

      // SEPTIEMBRE 2026
      { id: 'doc_2026_09_01', type: 'FORMA_LIBRE', num: 288, client: 'mantica', date: '2026-09-05', rate: 810, total: 350, items: [
        { description: 'Manejo de redes sociales - Septiembre', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 350 }
      ]},
      { id: 'doc_2026_09_02', type: 'RECIBO', num: 355, client: 'dra-dama', date: '2026-09-01', rate: 810, total: 250, items: [
        { description: 'Manejo de Redes Sociales y Contenido Médico', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 }
      ]},
      { id: 'doc_2026_09_03', type: 'RECIBO', num: 356, client: 'odontologo-rony', date: '2026-09-01', rate: 810, total: 250, items: [
        { description: 'Manejo de Redes Sociales Odontológicas', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 }
      ]},
      { id: 'doc_2026_09_04', type: 'RECIBO', num: 357, client: 'soc-mastologia', date: '2026-09-18', rate: 810, total: 540, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 240 },
        { description: 'Capacitación y Formación Digital para Médicos', category: 'FORMACION', unit: 'Capacitación', quantity: 1, amount: 300 }
      ]},
      { id: 'doc_2026_09_05', type: 'RECIBO', num: 358, client: 'dr-gerardo', date: '2026-09-01', rate: 810, total: 370, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 },
        { description: 'Presupuesto Meta Ads Campañas', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 120 }
      ]},
      { id: 'doc_2026_09_06', type: 'FORMA_LIBRE', num: 289, client: 'feminaid', date: '2026-09-22', rate: 810, total: 500, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 320 },
        { description: 'Impresión de material publicitario y rotulados', category: 'MATERIAL_IMPRESO', unit: 'Producción', quantity: 1, amount: 180 }
      ]},
      { id: 'doc_2026_09_07', type: 'RECIBO', num: 359_01, client: 'sovemo', date: '2026-09-24', rate: 810, total: 380, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 150 },
        { description: 'Cobertura de grabación en Congreso Médico', category: 'GRABACIONES', unit: 'Cobertura', quantity: 1, amount: 230 }
      ]},
      { id: 'doc_2026_09_08', type: 'FORMA_LIBRE', num: 290, client: 'cc-garcia', date: '2026-09-02', rate: 850, total: 170, items: [
        { description: 'Manejo mensual de redes sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 140 },
        { description: 'Jornada de grabación mensual', category: 'GRABACIONES', unit: 'Jornada', quantity: 1, amount: 30 }
      ]},

      // OCTUBRE 2026
      { id: 'doc_2026_10_01', type: 'FORMA_LIBRE', num: 298, client: 'mantica', date: '2026-10-05', rate: 888.12, total: 350, items: [
        { description: 'Manejo de redes sociales - Octubre', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 350 }
      ]},
      { id: 'doc_2026_10_02', type: 'RECIBO', num: 360, client: 'dr-gerardo', date: '2026-10-01', rate: 888.12, total: 370, items: [
        { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 },
        { description: 'Pauta Publicitaria Meta Ads', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 120 }
      ]},
      { id: 'doc_2026_10_03', type: 'FORMA_LIBRE', num: 299, client: 'cc-garcia', date: '2026-10-02', rate: 947.76, total: 170, items: [
        { description: 'Manejo mensual de redes sociales', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 140 },
        { description: 'Jornada de grabación presencial en tienda', category: 'GRABACIONES', unit: 'Jornada', quantity: 1, amount: 30 }
      ]},
      { id: 'doc_2026_10_04', type: 'RECIBO', num: 361, client: 'dra-dama', date: '2026-10-01', rate: 888.12, total: 250, items: [
        { description: 'Manejo de Redes Sociales Médicas', category: 'MARKETING_RRSS', unit: 'Servicio', quantity: 1, amount: 250 }
      ]},
      { id: 'doc_2026_10_05', type: 'RECIBO', num: 362, client: 'sovemo', date: '2026-10-24', rate: 888.12, total: 660, items: [
        { description: 'Cobertura presencial evento médico SOVEMO (2 días)', category: 'GRABACIONES', unit: 'Jornada', quantity: 2, amount: 460 },
        { description: 'Pauta publicitaria y difusión digital (2 días)', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 200 }
      ]}
    ];

    for (const h of historical) {
      const subtotalBs = Number((h.total * h.rate).toFixed(2));
      const ivaRate = h.type === 'FORMA_LIBRE' ? 0.16 : 0;
      const ivaAmountBs = Number((subtotalBs * ivaRate).toFixed(2));
      const totalBs = subtotalBs + ivaAmountBs;

      insertStmt.run(
        h.id, h.type, h.num, h.client, h.date, h.date,
        'EMITTED', 'PAID', 'USD', h.total,
        'BCV', h.rate, h.rate,
        subtotalBs, ivaRate, ivaAmountBs, totalBs,
        totalBs, h.total,
        JSON.stringify(h.items),
        'Facturación histórica categorizada por área de servicio',
        'TRANSFERENCIA_BS', h.date
      );
    }
    console.log(`Seeded ${historical.length} categorized historical documents.`);
  }

  // Asegurar siempre corrección de SOVEMO (cobertura + pauta 2 días por $660) en Octubre 2026
  const existingDoc1005 = db.prepare('SELECT client_id FROM documents WHERE id = ?').get('doc_2026_10_05') as any;
  if (existingDoc1005?.client_id === 'english-lab' || !existingDoc1005) {
    const rate = 888.12;
    const total = 660;
    const subtotalBs = Number((total * rate).toFixed(2));
    const items = [
      { description: 'Cobertura presencial evento médico SOVEMO (2 días)', category: 'GRABACIONES', unit: 'Jornada', quantity: 2, amount: 460 },
      { description: 'Pauta publicitaria y difusión digital (2 días)', category: 'MARKETING_ADS', unit: 'Campaña', quantity: 1, amount: 200 }
    ];
    db.prepare(`
      INSERT OR REPLACE INTO documents (
        id, doc_type, doc_number, client_id, issue_date, due_date,
        status, payment_status, currency, total_amount_currency,
        rate_type_applied, applied_rate, bcv_rate_at_issue,
        subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
        base_bs_bcv, base_usd_bcv, items_json, notes, payment_method, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'doc_2026_10_05', 'RECIBO', 362, 'sovemo', '2026-10-24', '2026-10-24',
      'EMITTED', 'PAID', 'USD', total,
      'BCV', rate, rate,
      subtotalBs, 0, 0, subtotalBs,
      subtotalBs, total,
      JSON.stringify(items),
      'Cobertura presencial y pauta de 2 días SOVEMO ($660)',
      'TRANSFERENCIA_BS', '2026-10-24'
    );
    console.log('Synchronized real SOVEMO 2-day coverage & pauta ($660) for October.');
  }
}
