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

  // Emisión y respaldo oficial de Factura Nº 301 para Centro Cerámico García (Forma Libre a tasa Promedio)
  try {
    // 1. Limpiar duplicados de prueba de Mantica del 3 de nov para que quede solo la factura Nº 300 oficial
    db.exec(`
      DELETE FROM documents 
      WHERE doc_type = 'FORMA_LIBRE' 
        AND client_id = 'mantica' 
        AND issue_date = '2026-11-03' 
        AND id IN ('doc_forma_libre_301', 'doc_forma_libre_300', 'doc_forma_libre_299');
    `);

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

      const insertStmt = db.prepare(`
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
      `);

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
  }
}
