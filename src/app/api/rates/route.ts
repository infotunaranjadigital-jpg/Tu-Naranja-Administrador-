import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey, getCurrentUser } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';
import { fetchLiveRates } from '@/lib/rates';

export async function GET(req: Request) {
  seedDatabase();
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { searchParams } = new URL(req.url);
  const forceSync = searchParams.get('sync') === 'true';

  let currentRate = db.prepare('SELECT * FROM exchange_rates WHERE date = ?').get(today) as any;

  // Si no hay tasa para hoy, o si la tasa guardada tiene Binance desactualizado (< 980) o se pide sync
  const isOutdated = !currentRate || currentRate.binance_usdt < 950 || forceSync;

  if (isOutdated) {
    try {
      const live = await fetchLiveRates();
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
      stmt.run(`rate_${live.date}`, live.date, live.bcv_usd, live.bcv_eur, live.binance_usdt, live.average_usd);
      currentRate = db.prepare('SELECT * FROM exchange_rates WHERE date = ?').get(today) as any;
    } catch (e) {
      console.warn('No se pudo actualizar tasas en vivo automáticamente:', e);
    }
  }

  if (!currentRate) {
    currentRate = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
  }

  // Historial de tasas
  const history = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 30').all();

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
    const body = await req.json();
    const db = getDb();

    // Sincronización en vivo automática
    if (body.action === 'SYNC_LIVE') {
      const live = await fetchLiveRates();
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
      stmt.run(`rate_${live.date}`, live.date, live.bcv_usd, live.bcv_eur, live.binance_usdt, live.average_usd);
      const updated = db.prepare('SELECT * FROM exchange_rates WHERE date = ?').get(live.date);
      return NextResponse.json({ success: true, rate: updated, message: 'Tasas sincronizadas con BCV y Binance P2P' });
    }

    const { bcv_usd, bcv_eur, binance_usdt, date } = body;

    if (!bcv_usd || !binance_usdt) {
      return NextResponse.json({ error: 'Valores de BCV USD y Binance USDT requeridos' }, { status: 400 });
    }

    const rateDate = date || new Date().toISOString().split('T')[0];
    const eur = bcv_eur || Number((bcv_usd * 1.08).toFixed(2));
    const avg = Number(((Number(bcv_usd) + Number(binance_usdt)) / 2).toFixed(2));

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
