import { getDb } from './db';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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
    const bcvUsd = 866.56;
    const bcvEur = 942.30;
    const binanceUsdt = 920.00;
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

    // 5. Cargar clientes y equipo desde seed_data.json
    const seedPath = path.join(process.cwd(), '..', '..', 'brain', '5b865809-13d5-4b31-b250-b427ff707464', 'scratch', 'seed_data.json');
    let seedData: any = null;
    if (fs.existsSync(seedPath)) {
      seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }

    if (seedData && seedData.clients) {
      const insertClient = db.prepare(`
        INSERT INTO clients (
          id, name, business_name, rif, phone, email, address,
          default_currency, base_monthly_fee, meta_ads_budget,
          default_rate_type, billing_day, preferred_document, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const c of seedData.clients) {
        insertClient.run(
          c.id, c.name, c.business_name || c.name, c.rif || '',
          c.phone || '', c.email || '', c.address || '',
          c.default_currency || 'USD', c.base_monthly_fee || 0,
          c.meta_ads_budget || 0, c.default_rate_type || 'BCV',
          c.billing_day || 1, c.preferred_document || 'RECIBO',
          c.notes || ''
        );
      }
      console.log(`Seeded ${seedData.clients.length} clients.`);
    }

    // Equipo real de Tu Naranja Digital
    const realTeam = [
      { id: 'tm_eleonora', name: 'Eleonora', role: 'Especialista / Coordinación', salary: 100, method: 'PAGO_MOVIL' },
      { id: 'tm_angie', name: 'Angie', role: 'Community Manager / Redacción', salary: 80, method: 'PAGO_MOVIL' },
      { id: 'tm_isabelle', name: 'Isabelle', role: 'Diseño / Contenido', salary: 100, method: 'BINANCE' },
      { id: 'tm_mariana', name: 'Mariana', role: 'Estrategia & Contenido', salary: 80, method: 'PAGO_MOVIL' },
      { id: 'tm_adis', name: 'Adis', role: 'Diseño & Audiovisual', salary: 80, method: 'PAGO_MOVIL' }
    ];

    const insertMember = db.prepare(`
      INSERT INTO team_members (
        id, name, role, monthly_salary, payment_method, payment_frequency, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const m of realTeam) {
      insertMember.run(
        m.id, m.name, m.role, m.salary,
        m.method, 'QUINCENAL',
        m.method === 'BINANCE' ? 'Cobro acordado exclusivamente por Binance USDT' : 'Pago móvil / Transferencia Bs'
      );
    }
    console.log(`Seeded ${realTeam.length} real team members.`);

    // Documentos historicos de ejemplo (Facturas 296, 297 y Recibos 356 a 359)
    const insertDoc = db.prepare(`
      INSERT INTO documents (
        id, doc_type, doc_number, client_id, issue_date, due_date,
        status, payment_status, currency, total_amount_currency,
        rate_type_applied, applied_rate, bcv_rate_at_issue,
        subtotal_bs, iva_rate, iva_amount_bs, total_bs_applied,
        base_bs_bcv, base_usd_bcv, items_json, notes, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Factura 297 a Feminaid
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

    // Recibo 359 a SOVEMO
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
}
