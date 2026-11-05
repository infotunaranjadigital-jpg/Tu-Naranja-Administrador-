import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'data', 'tu_naranja.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    _db = new DatabaseSync(DB_PATH);
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'partner'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
      bcv_usd REAL NOT NULL,
      bcv_eur REAL NOT NULL,
      binance_usdt REAL NOT NULL,
      average_usd REAL NOT NULL, -- Promedio entre BCV USD y Binance USDT
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_name TEXT,
      rif TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      default_currency TEXT DEFAULT 'USD',
      base_monthly_fee REAL DEFAULT 0,
      meta_ads_budget REAL DEFAULT 0,
      default_rate_type TEXT DEFAULT 'BCV', -- 'BCV', 'BINANCE', 'PROMEDIO', 'EURO', 'EFECTIVO'
      billing_day INTEGER DEFAULT 1,
      preferred_document TEXT DEFAULT 'RECIBO', -- 'FORMA_LIBRE', 'RECIBO'
      is_withholding_agent INTEGER DEFAULT 0, -- 1 si es agente de retencion SENIAT
      iva_retention_percent REAL DEFAULT 75,
      islr_retention_percent REAL DEFAULT 2,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_fee_history (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      date TEXT NOT NULL,
      previous_fee REAL NOT NULL,
      new_fee REAL NOT NULL,
      reason TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      doc_type TEXT NOT NULL, -- 'FORMA_LIBRE', 'RECIBO'
      doc_number INTEGER NOT NULL, -- 298, 360, etc
      client_id TEXT NOT NULL,
      issue_date TEXT NOT NULL, -- YYYY-MM-DD
      due_date TEXT,
      status TEXT DEFAULT 'EMITTED', -- 'DRAFT', 'EMITTED', 'PAID', 'CANCELLED'
      payment_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PARTIAL', 'PAID'
      currency TEXT DEFAULT 'USD',
      total_amount_currency REAL NOT NULL,
      rate_type_applied TEXT NOT NULL, -- 'BCV', 'BINANCE', 'PROMEDIO', 'EURO', 'EFECTIVO', 'CUSTOM'
      applied_rate REAL NOT NULL, -- Tasa usada para liquidar el monto
      bcv_rate_at_issue REAL NOT NULL, -- Tasa oficial BCV del dia de emision (PATRON BASE)
      subtotal_bs REAL NOT NULL,
      iva_rate REAL DEFAULT 0, -- 0.16 para forma libre, 0 para recibo por defecto
      iva_amount_bs REAL DEFAULT 0,
      total_bs_applied REAL NOT NULL,
      is_withholding_applied INTEGER DEFAULT 0,
      iva_retention_percent REAL DEFAULT 0,
      iva_retention_amount_bs REAL DEFAULT 0,
      islr_retention_percent REAL DEFAULT 0,
      islr_retention_amount_bs REAL DEFAULT 0,
      net_payable_bs REAL DEFAULT 0,
      net_payable_usd REAL DEFAULT 0,
      base_bs_bcv REAL NOT NULL, -- Equivalente total en Bs a tasa BCV del día
      base_usd_bcv REAL NOT NULL, -- Equivalente en USD oficial BCV
      items_json TEXT NOT NULL, -- JSON array de items
      notes TEXT,
      payment_method TEXT, -- 'EFECTIVO_USD', 'BINANCE_USDT', 'PAGO_MOVIL', 'TRANSFERENCIA_BS', 'ZELLE', 'PAYPAL'
      payment_reference TEXT,
      paid_at DATETIME,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      monthly_salary REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'PAGO_MOVIL', -- 'BINANCE', 'PAGO_MOVIL', 'EFECTIVO', 'ZELLE'
      payment_frequency TEXT DEFAULT 'QUINCENAL',
      rate_rule TEXT DEFAULT 'BCV', -- 'BCV', 'EURO_INCENTIVE', 'BINANCE'
      incentive_rule TEXT,
      active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_payments (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      date TEXT NOT NULL,
      period TEXT NOT NULL, -- ej 'Octubre 1ra Quincena'
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      rate_type TEXT,
      rate_applied REAL,
      amount_bs REAL,
      payment_method TEXT,
      reference TEXT,
      status TEXT DEFAULT 'PAID',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES team_members(id)
    );

    CREATE TABLE IF NOT EXISTS designer_evaluations (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL, -- 'tm_adis', 'tm_mariana'
      designer_name TEXT NOT NULL,
      week_start_date TEXT NOT NULL, -- Fecha del lunes evaluado (YYYY-MM-DD)
      week_label TEXT NOT NULL, -- ej 'Semana 4 - Octubre 2026'
      clients_worked TEXT NOT NULL, -- JSON array de clientes atendidos
      static_posts_count INTEGER DEFAULT 0,
      reels_count INTEGER DEFAULT 0,
      carousels_count INTEGER DEFAULT 0,
      extra_works_count INTEGER DEFAULT 0,
      total_pieces INTEGER DEFAULT 0,
      returned_pieces_count INTEGER DEFAULT 0, -- Fichas devueltas por corrección
      error_rate_percent REAL DEFAULT 0, -- % de error sobre total
      correction_reasons TEXT, -- Motivos de correcciones
      feedback_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES team_members(id)
    );

    CREATE TABLE IF NOT EXISTS member_evaluations (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      evaluation_date TEXT NOT NULL,
      period TEXT NOT NULL,
      overall_score REAL NOT NULL,
      strengths TEXT,
      improvements TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES team_members(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  try {
    db.exec(`ALTER TABLE team_members ADD COLUMN rate_rule TEXT DEFAULT 'BCV'`);
  } catch {}
  try {
    db.exec(`ALTER TABLE team_members ADD COLUMN incentive_rule TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE team_members ADD COLUMN soft_skills TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE team_members ADD COLUMN hard_skills TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE team_members ADD COLUMN bio TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN client_rif TEXT`);
  } catch {}
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN is_withholding_agent INTEGER DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN iva_retention_percent REAL DEFAULT 75`);
  } catch {}
  try {
    db.exec(`ALTER TABLE clients ADD COLUMN islr_retention_percent REAL DEFAULT 2`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN is_withholding_applied INTEGER DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN iva_retention_percent REAL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN iva_retention_amount_bs REAL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN islr_retention_percent REAL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN islr_retention_amount_bs REAL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN net_payable_bs REAL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN net_payable_usd REAL DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE designer_evaluations ADD COLUMN approved_first_time_count INTEGER DEFAULT 0`);
  } catch {}
  try {
    db.exec(`ALTER TABLE designer_evaluations ADD COLUMN clean_rate_percent REAL DEFAULT 0`);
  } catch {}

  // Garantizar separación absoluta y nombres canónicos de Arinita y Odontólogo (Dr. Rony)
  try {
    db.exec(`UPDATE documents SET client_id = 'arinita' WHERE client_id IN ('arianita', 'odontologo-arinita')`);
  } catch {}
  try {
    db.exec(`
      DELETE FROM clients WHERE id IN ('arianita', 'odontologo-arinita')
        OR (name LIKE '%Arinita%' AND id != 'arinita') 
        OR (name LIKE '%Odont%' AND name LIKE '%Arinita%')
        OR (name LIKE '%Odontologo / Arinita%')
        OR (name LIKE '%Odontólogo / Arinita%');
    `);
  } catch {}
  try {
    db.exec(`
      UPDATE clients SET 
        name = 'Arinita',
        business_name = 'Arinita',
        base_monthly_fee = 170.0
      WHERE id = 'arinita';
    `);
  } catch {}
  try {
    db.exec(`
      UPDATE clients SET 
        name = 'Odontólogo (Dr. Rony)',
        business_name = 'Odontólogo (Dr. Rony)',
        base_monthly_fee = 250.0
      WHERE id = 'odontologo-rony';
    `);
  } catch {}
  try {
    db.exec(`UPDATE clients SET base_monthly_fee = 150.0 WHERE id = 'sovemo'`);
  } catch {}
  try {
    db.exec(`UPDATE clients SET base_monthly_fee = 170.0 WHERE id = 'cc-garcia'`);
  } catch {}
  try {
    db.exec(`UPDATE clients SET base_monthly_fee = 250.0 WHERE id = 'dra-dama'`);
  } catch {}

  // Soporte para número de control pre-impreso y arranque en 300
  try {
    db.exec(`ALTER TABLE documents ADD COLUMN control_number TEXT`);
  } catch {}
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_forma_libre_number') as { value?: string } | undefined;
    if (!row || !row.value || parseInt(String(row.value), 10) < 299) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', '299');
    }
  } catch {}
  try {
    db.exec(`
      UPDATE documents 
      SET doc_number = 300 
      WHERE doc_type = 'FORMA_LIBRE' 
        AND issue_date >= '2026-11-01' 
        AND doc_number IN (298, 299);
    `);
    const maxDoc = db.prepare(`SELECT MAX(doc_number) as max_num FROM documents WHERE doc_type = 'FORMA_LIBRE'`).get() as { max_num?: number } | undefined;
    if (maxDoc && maxDoc.max_num) {
      db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('last_forma_libre_number', String(maxDoc.max_num));
    }
  } catch {}
  // Asegurar feminaid en trabajos puntuales (sin mensualidad)
  try {
    db.exec(`
      UPDATE clients 
      SET base_monthly_fee = 0.0, 
          notes = 'Cliente para trabajos puntuales (rotulados e impresiones especiales). No tiene mensualidad fija de redes sociales.' 
      WHERE id = 'feminaid';
    `);
  } catch {}

    // Limpieza y sincronización canónica de Facturas Forma Libre (Noviembre 2026):
  // Factura 300: MANTICA - Campaña Noviembre Azul / Cáncer de Próstata ($404 USD, Tasa BCV 893.22 Bs/$)
  // Factura 301: MANTICA - Mensualidad Noviembre + Ads + Mes Rosa ($490 USD, Tasa BCV 889.58 Bs/$)
  // Factura 302: Centro Cerámico García ($170 USD, Tasa Promedio 946.31 Bs/$, Nº de Control 302)
  try {
    db.exec(`
      DELETE FROM documents 
      WHERE doc_type = 'FORMA_LIBRE' 
        AND issue_date >= '2026-11-01' 
        AND id IN ('doc_forma_libre_298', 'doc_forma_libre_299', 'doc_forma_libre_300', 'doc_forma_libre_301', 'doc_forma_libre_302');
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

    // 1. Factura 300: MANTICA - Campaña de Cáncer de Próstata ($404 USD a tasa BCV hoy 893.22)
    // Ítems 1 al 4 de la cotización TND-2026-1055-OP1 (excluyendo ítem 5)
    const bcvToday = 893.22;
    const prostataTotalUsd = 404.0;
    const prostataSubtotalBs = Number((prostataTotalUsd * bcvToday).toFixed(2)); // 360860.88
    const prostataIvaBs = Number((prostataSubtotalBs * 0.16).toFixed(2)); // 57737.74
    const prostataTotalBs = Number((prostataSubtotalBs + prostataIvaBs).toFixed(2)); // 418598.62
    const prostataIvaRet = Number(((prostataIvaBs * 75) / 100).toFixed(2)); // 43303.31
    const prostataIslrRet = Number(((prostataSubtotalBs * 2) / 100).toFixed(2)); // 7217.22
    const prostataNetPayableBs = Number((prostataTotalBs - prostataIvaRet - prostataIslrRet).toFixed(2)); // 368078.09
    const prostataNetPayableUsd = Number((prostataNetPayableBs / bcvToday).toFixed(2)); // 412.08

    const prostataItems = [
      {
        description: 'Diseño Gráfico & Conceptualización Temática (Noviembre Azul)',
        category: 'MARKETING_RRSS',
        unit: 'Paquete',
        quantity: 1,
        unitPrice: 120.0,
        amount: 120.0
      },
      {
        description: 'Viniles Laminados para Ascensores (Efecto Continuo de Unión)',
        category: 'MATERIAL_IMPRESO',
        unit: 'Ascensores',
        quantity: 2,
        unitPrice: 94.5,
        amount: 189.0
      },
      {
        description: 'Rotulado de Stickers en Cristales y Ventanales',
        category: 'MATERIAL_IMPRESO',
        unit: 'Ventanas',
        quantity: 3,
        unitPrice: 16.67,
        amount: 50.0
      },
      {
        description: 'Impresión y Rotulado de Logos Institucionales / Campaña',
        category: 'MATERIAL_IMPRESO',
        unit: 'Unidades',
        quantity: 4,
        unitPrice: 11.25,
        amount: 45.0
      }
    ];

    insertDoc.run(
      'doc_forma_libre_300', 'FORMA_LIBRE', 300, 'mantica', 'J-00059876-2', '2026-11-04', '2026-11-04',
      'EMITTED', 'PENDING', 'USD', prostataTotalUsd,
      'BCV', bcvToday, bcvToday,
      prostataSubtotalBs, 0.16, prostataIvaBs, prostataTotalBs,
      1, 75, prostataIvaRet,
      2, prostataIslrRet, prostataNetPayableBs, prostataNetPayableUsd,
      prostataTotalBs, prostataTotalUsd, JSON.stringify(prostataItems),
      'Campaña Noviembre Azul / Prevención Cáncer de Próstata - Cotización TND-2026-1055-OP1',
      'TRANSFERENCIA_BS', null, null, 'Jarvick', null
    );

    // 2. Factura 301: MANTICA - Mensualidad Noviembre ($490 USD a tasa BCV 889.58)
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

    // 3. Factura 302: Centro Cerámico García (con Nº de Control SENIAT 302)
    const garciaItems = [
      { description: 'Manejo mensual de redes sociales (noviembre)', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 140 },
      { description: 'Jornada de grabación mensual en tienda', category: 'GRABACIONES', unit: '1.0', quantity: 1, amount: 30 }
    ];

    insertDoc.run(
      'doc_forma_libre_302', 'FORMA_LIBRE', 302, 'cc-garcia', 'J-31275024-3', '2026-11-03', '2026-11-03',
      'EMITTED', 'PENDING', 'USD', 170.0,
      'PROMEDIO', 946.31, 891.11,
      160872.70, 0.16, 25739.63, 186612.33,
      1, 75, 19304.72,
      2, 3217.45, 164090.16, 149.33,
      180238.12, 170.0, JSON.stringify(garciaItems), 'Cobro mensualidad noviembre a tasa promedio P2P/BCV + Jornada de grabación',
      'TRANSFERENCIA_BS', null, null, 'Jarvick', '302'
    );

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_forma_libre_number', '302')").run();
  } catch (e) {
    console.warn('Error migration November Forma Libre:', e);
  }

  // Inactivar Arinita (Arianita Variedades) temporalmente
  try {
    db.exec(`UPDATE clients SET active = 0 WHERE id = 'arinita';`);
  } catch (e) {
    console.warn('Error inactivating arinita:', e);
  }
}
