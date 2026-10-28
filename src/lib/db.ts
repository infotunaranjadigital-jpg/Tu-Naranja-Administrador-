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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
