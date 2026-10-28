import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { validateApiKey } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function POST(req: Request) {
  seedDatabase();
  const apiKey = req.headers.get('x-api-key');

  if (!validateApiKey(apiKey)) {
    return NextResponse.json({ error: 'Clave de API inválida' }, { status: 401 });
  }

  try {
    const { action, payload } = await req.json();
    const db = getDb();

    switch (action) {
      case 'GET_STATUS': {
        const clientCount = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as any).c;
        const docCount = (db.prepare('SELECT COUNT(*) as c FROM documents').get() as any).c;
        const rate = db.prepare('SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 1').get();
        return NextResponse.json({
          status: 'online',
          rates: rate,
          totals: { clients: clientCount, documents: docCount }
        });
      }

      case 'UPDATE_RATES': {
        const { bcv_usd, binance_usdt, bcv_eur, date } = payload;
        const d = date || new Date().toISOString().split('T')[0];
        const eur = bcv_eur || Number((bcv_usd * 1.08).toFixed(2));
        const avg = Number(((Number(bcv_usd) + Number(binance_usdt)) / 2).toFixed(2));
        db.prepare(`
          INSERT INTO exchange_rates (id, date, bcv_usd, bcv_eur, binance_usdt, average_usd, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(date) DO UPDATE SET
            bcv_usd = excluded.bcv_usd,
            bcv_eur = excluded.bcv_eur,
            binance_usdt = excluded.binance_usdt,
            average_usd = excluded.average_usd,
            updated_at = CURRENT_TIMESTAMP
        `).run(`rate_${d}`, d, Number(bcv_usd), eur, Number(binance_usdt), avg);

        return NextResponse.json({ success: true, message: `Tasas actualizadas para ${d}` });
      }

      case 'EXECUTE_QUERY': {
        // Read-only SQL for safety
        const { sql } = payload;
        if (!sql.trim().toUpperCase().startsWith('SELECT')) {
          return NextResponse.json({ error: 'Solo se permiten consultas SELECT en este modo' }, { status: 403 });
        }
        const rows = db.prepare(sql).all();
        return NextResponse.json({ results: rows });
      }

      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
