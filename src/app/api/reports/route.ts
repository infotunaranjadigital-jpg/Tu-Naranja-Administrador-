import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: Request) {
  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  // 1. Totales generales del año seleccionado
  const totalsStmt = db.prepare(`
    SELECT
      COUNT(*) as total_documents,
      SUM(CASE WHEN payment_status = 'PAID' THEN total_amount_currency ELSE 0 END) as collected_usd,
      SUM(CASE WHEN payment_status = 'PENDING' THEN total_amount_currency ELSE 0 END) as pending_usd,
      SUM(total_amount_currency) as total_usd,
      SUM(total_bs_applied) as total_bs_collected_or_applied,
      SUM(base_bs_bcv) as total_base_bs_bcv,
      SUM(base_usd_bcv) as total_base_usd_bcv
    FROM documents
    WHERE strftime('%Y', issue_date) = ?
  `);
  const totals = totalsStmt.get(year);

  // 2. Facturación anual por cliente
  const clientBreakdownStmt = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.business_name,
      c.base_monthly_fee,
      c.default_rate_type,
      COUNT(d.id) as doc_count,
      SUM(d.total_amount_currency) as total_currency,
      SUM(d.total_bs_applied) as total_bs_applied,
      SUM(d.base_bs_bcv) as total_base_bs_bcv,
      SUM(d.base_usd_bcv) as total_base_usd_bcv,
      (SELECT MAX(date) FROM client_fee_history WHERE client_id = c.id) as last_fee_adjustment
    FROM clients c
    LEFT JOIN documents d ON c.id = d.client_id AND strftime('%Y', d.issue_date) = ?
    GROUP BY c.id
    ORDER BY total_base_usd_bcv DESC
  `);
  const clientBreakdown = clientBreakdownStmt.all(year);

  // 3. Desglose mensual del año (para gráficos o comparativa)
  const monthlyStmt = db.prepare(`
    SELECT
      strftime('%m', issue_date) as month,
      COUNT(*) as docs_count,
      SUM(total_amount_currency) as total_usd,
      SUM(total_bs_applied) as total_bs_applied,
      SUM(base_bs_bcv) as total_base_bs_bcv,
      SUM(base_usd_bcv) as total_base_usd_bcv
    FROM documents
    WHERE strftime('%Y', issue_date) = ?
    GROUP BY strftime('%m', issue_date)
    ORDER BY month ASC
  `);
  const monthlyBreakdown = monthlyStmt.all(year);

  // 4. Cuentas por cobrar pendientes (Alertas de cobro)
  const pendingStmt = db.prepare(`
    SELECT
      d.*,
      c.name as client_name,
      c.phone as client_phone
    FROM documents d
    JOIN clients c ON d.client_id = c.id
    WHERE d.payment_status = 'PENDING'
    ORDER BY d.issue_date ASC
  `);
  const pendingDebts = pendingStmt.all();

  return NextResponse.json({
    year,
    totals,
    clientBreakdown,
    monthlyBreakdown,
    pendingDebts
  });
}
