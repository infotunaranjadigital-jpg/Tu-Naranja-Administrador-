import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: Request) {
  seedDatabase();
  const db = getDb();
  const { searchParams } = new URL(req.url);

  // Fechas de rango: por defecto últimos 6 meses hasta fin del mes actual
  const today = new Date();
  const defaultEnd = today.toISOString().split('T')[0];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const defaultStart = sixMonthsAgo.toISOString().split('T')[0];

  const startDate = searchParams.get('startDate') || defaultStart;
  const endDate = searchParams.get('endDate') || defaultEnd;

  // Meses para comparativa (ej. 2026-10 vs 2025-10)
  const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
  const lastYearMonthStr = `${today.getFullYear() - 1}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const compareMonthA = searchParams.get('compareMonthA') || currentMonthStr;
  const compareMonthB = searchParams.get('compareMonthB') || lastYearMonthStr;

  // 1. Totales dentro del rango de fechas
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
    WHERE issue_date >= ? AND issue_date <= ?
  `);
  const totals = totalsStmt.get(startDate, endDate) as any;

  // 2. Serie Mes a Mes en el rango (para el gráfico interactivo)
  const monthlyStmt = db.prepare(`
    SELECT
      strftime('%Y-%m', issue_date) as month,
      COUNT(*) as docs_count,
      SUM(total_amount_currency) as total_usd,
      SUM(total_bs_applied) as total_bs_applied,
      SUM(base_bs_bcv) as total_base_bs_bcv,
      SUM(base_usd_bcv) as total_base_usd_bcv
    FROM documents
    WHERE issue_date >= ? AND issue_date <= ?
    GROUP BY strftime('%Y-%m', issue_date)
    ORDER BY month ASC
  `);
  const monthlySeries = monthlyStmt.all(startDate, endDate) as any[];

  // Identificar mes pico (más facturado) y mes más bajo
  let maxAmount = -1;
  let minAmount = Infinity;
  let peakMonth = null;
  let lowestMonth = null;

  if (monthlySeries.length > 0) {
    for (const m of monthlySeries) {
      const val = m.total_base_usd_bcv || 0;
      if (val > maxAmount) {
        maxAmount = val;
        peakMonth = m.month;
      }
      if (val < minAmount && val > 0) {
        minAmount = val;
        lowestMonth = m.month;
      }
    }
    // Si todos son cero o no hay minAmount
    if (minAmount === Infinity) minAmount = 0;
  }

  // 3. Comparativa Mes A vs Mes B (ej. Octubre 2026 vs Octubre 2025)
  const monthDataStmt = db.prepare(`
    SELECT
      strftime('%Y-%m', issue_date) as month,
      COUNT(*) as docs_count,
      SUM(total_amount_currency) as total_usd,
      SUM(total_bs_applied) as total_bs_applied,
      SUM(base_bs_bcv) as total_base_bs_bcv,
      SUM(base_usd_bcv) as total_base_usd_bcv
    FROM documents
    WHERE strftime('%Y-%m', issue_date) = ?
  `);

  const monthAData = (monthDataStmt.get(compareMonthA) as any) || {
    month: compareMonthA,
    docs_count: 0,
    total_usd: 0,
    total_base_usd_bcv: 0,
    total_base_bs_bcv: 0
  };

  const monthBData = (monthDataStmt.get(compareMonthB) as any) || {
    month: compareMonthB,
    docs_count: 0,
    total_usd: 0,
    total_base_usd_bcv: 0,
    total_base_bs_bcv: 0
  };

  const valA = monthAData.total_base_usd_bcv || 0;
  const valB = monthBData.total_base_usd_bcv || 0;
  const diffUsd = valA - valB;
  const diffPercent = valB > 0 ? Number(((diffUsd / valB) * 100).toFixed(1)) : (valA > 0 ? 100 : 0);

  const comparison = {
    monthA: { label: compareMonthA, ...monthAData },
    monthB: { label: compareMonthB, ...monthBData },
    diffUsd,
    diffPercent
  };

  // 4. Detalle por cliente en el rango de fechas seleccionado
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
    LEFT JOIN documents d ON c.id = d.client_id AND d.issue_date >= ? AND d.issue_date <= ?
    GROUP BY c.id
    ORDER BY total_base_usd_bcv DESC
  `);
  const clientBreakdown = clientBreakdownStmt.all(startDate, endDate);

  // 5. Cuentas por cobrar pendientes
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

  // 6. Pronóstico de Ingreso Mensual Recurrente (MRR)
  // Excluye clientes por acuerdos o convenios especiales.
  // En Autopartes Los Rosales ($200 efectivo), $100 corresponden a Isa y $100 a la agencia.
  const allActiveClients = db.prepare('SELECT * FROM clients WHERE active = 1 ORDER BY base_monthly_fee DESC, name ASC').all() as any[];
  
  let bcvRate = 888.12;
  const latestRateRow = db.prepare('SELECT bcv_usd FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
  if (latestRateRow?.bcv_usd) bcvRate = Number(latestRateRow.bcv_usd);

  let forecastGrossUsd = 0;
  let sharedIsaDeduction = 0;
  let regularClientsCount = 0;
  const forecastClientsList: any[] = [];
  const agreementClientsList: any[] = [];

  for (const c of allActiveClients) {
    const isAgreement = c.id === 'arianita' || 
      (c.notes && (c.notes.toLowerCase().includes('convenio') || c.notes.toLowerCase().includes('acuerdo')));
    const isAutopartes = c.id === 'los-rosales';

    if (isAgreement) {
      agreementClientsList.push({
        id: c.id,
        name: c.name,
        business_name: c.business_name,
        base_monthly_fee: c.base_monthly_fee,
        reason: 'Cliente por acuerdo o convenio especial (excluido de pronóstico fijo recurrente)'
      });
    } else {
      let clientFee = Number(c.base_monthly_fee) || 0;
      let netForAgency = clientFee;
      let sharedForIsa = 0;

      if (isAutopartes) {
        sharedForIsa = 100; // $100 corresponden a Isa
        netForAgency = 100; // $100 corresponden a la agencia
        sharedIsaDeduction += sharedForIsa;
      }

      forecastGrossUsd += clientFee;
      regularClientsCount++;

      forecastClientsList.push({
        id: c.id,
        name: c.name,
        business_name: c.business_name,
        billing_day: c.billing_day,
        total_fee_usd: clientFee,
        agency_net_usd: netForAgency,
        shared_isa_usd: sharedForIsa,
        default_rate_type: c.default_rate_type,
        shared_note: isAutopartes 
          ? 'Cliente compartido con Isabelle ($100 corresponden a Isa / $100 a la agencia)' 
          : null
      });
    }
  }

  const forecastNetAgencyUsd = forecastGrossUsd - sharedIsaDeduction;
  const forecastNetAgencyBs = Number((forecastNetAgencyUsd * bcvRate).toFixed(2));
  const forecastGrossBs = Number((forecastGrossUsd * bcvRate).toFixed(2));

  const monthlyForecast = {
    grossTotalUsd: forecastGrossUsd,
    grossTotalBs: forecastGrossBs,
    sharedIsaDeductionUsd: sharedIsaDeduction,
    netAgencyUsd: forecastNetAgencyUsd,
    netAgencyBs: forecastNetAgencyBs,
    bcvRateApplied: bcvRate,
    regularClientsCount,
    agreementClientsCount: agreementClientsList.length,
    forecastClientsList,
    agreementClientsList,
    sharedAutopartesNote: 'Autopartes Los Rosales cobra $200 en efectivo: $100 corresponden a Isabelle y $100 a Tu Naranja Digital.'
  };

  return NextResponse.json({
    range: { startDate, endDate },
    totals,
    monthlySeries,
    stats: {
      peakMonth,
      peakAmount: maxAmount > -1 ? maxAmount : 0,
      lowestMonth,
      lowestAmount: minAmount !== Infinity ? minAmount : 0
    },
    comparison,
    monthlyForecast,
    clientBreakdown,
    pendingDebts
  });
}
