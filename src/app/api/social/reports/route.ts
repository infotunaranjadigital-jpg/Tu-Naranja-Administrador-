import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    const period = searchParams.get('period');

    const db = getDb();
    let query = 'SELECT * FROM monthly_social_reports';
    const params: any[] = [];

    if (clientId && period) {
      query += ' WHERE client_id = ? AND period = ?';
      params.push(clientId, period);
    } else if (clientId) {
      query += ' WHERE client_id = ? ORDER BY period DESC';
      params.push(clientId);
    } else {
      query += ' ORDER BY period DESC, created_at DESC';
    }

    const reports = db.prepare(query).all(...params);

    const parsedReports = reports.map((r: any) => ({
      ...r,
      sentiment_breakdown: r.sentiment_breakdown_json ? JSON.parse(r.sentiment_breakdown_json) : [],
      top_posts: r.top_posts_json ? JSON.parse(r.top_posts_json) : [],
      raw_metrics: r.raw_metrics_json ? JSON.parse(r.raw_metrics_json) : {}
    }));

    return NextResponse.json({
      success: true,
      reports: parsedReports
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
