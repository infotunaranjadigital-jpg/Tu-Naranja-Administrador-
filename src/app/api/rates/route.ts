import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: Request) {
  seedDatabase();
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Try to get today's rate, or the latest rate
  let stmt = db.prepare('SELECT * FROM exchange_rates WHERE date = ?');
  let currentRate = stmt.get(today) as any;

  if (!currentRate) {
    stmt = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1');
    currentRate = stmt.get() as any;
  }

  // Get historical rates
  const historyStmt = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 30');
  const history = historyStmt.all();

  return NextResponse.json({
    current: currentRate,
    history
  });
}

export async function POST(req: Request) {
  seedDatabase();
  const apiKey = req.headers.get('x-api-key');
  const user = await getCurrentUser();

  if (!validateApiKey(apiKey) && !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { bcv_usd, bcv_eur, binance_usdt, date } = await req.json();

    if (!bcv_usd || !binance_usdt) {
      return NextResponse.json({ error: 'Valores de BCV USD y Binance USDT requeridos' }, { status: 400 });
    }

    const rateDate = date || new Date().toISOString().split('T')[0];
    const eur = bcv_eur || Number((bcv_usd * 1.08).toFixed(2));
    const avg = Number(((Number(bcv_usd) + Number(binance_usdt)) / 2).toFixed(2));

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO exchange_rates (id, date, bcv_usd, bcv_eur, binance_usdt, average_usd, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(date) DO UPDATE SET
        bcv_usd = excluded.bcv_usd,
        bcv_eur = excluded.bcv_eur,
        binance_usdt = excluded.binance_usdt,
        average_usd = excluded.average_usd,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(`rate_${rateDate}`, rateDate, Number(bcv_usd), Number(eur), Number(binance_usdt), avg);

    const updated = db.prepare('SELECT * FROM exchange_rates WHERE date = ?').get(rateDate);
    return NextResponse.json({ success: true, rate: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
