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
      c.is_withholding_agent,
      c.notes,
      COUNT(d.id) as doc_count,
      SUM(d.total_amount_currency) as total_currency,
      SUM(d.total_bs_applied) as total_bs_applied,
      SUM(d.base_bs_bcv) as total_base_bs_bcv,
      SUM(d.base_usd_bcv) as total_base_usd_bcv,
      (SELECT MAX(date) FROM client_fee_history WHERE client_id = c.id) as last_fee_adjustment
    FROM clients c
    LEFT JOIN documents d ON c.id = d.client_id AND d.issue_date >= ? AND d.issue_date <= ?
    WHERE c.active = 1
    GROUP BY c.id
    ORDER BY c.base_monthly_fee DESC
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

  // 6. Análisis Dinámico de Ingresos por Categorías / Líneas de Negocio (Notion Style)
  // Categorías:
  // - MARKETING_RRSS: Manejo de Redes Sociales
  // - MARKETING_ADS: Meta Ads & Pauta Publicitaria
  // - MARKETING_OTROS: Otros de Marketing & Branding
  // - DESARROLLO: Desarrollo Web & Software
  // - GRABACIONES: Grabaciones Extra & Coberturas
  // - FORMACION: Formación & Capacitación
  // - MATERIAL_IMPRESO: Material Impreso & Rotulados
  const categoryMeta: Record<string, { id: string; name: string; group: string; groupName: string; icon: string; color: string }> = {
    MARKETING_RRSS: { id: 'MARKETING_RRSS', name: 'Manejo de Redes Sociales', group: 'MARKETING', groupName: 'Marketing Digital', icon: '📱', color: '#f97316' },
    MARKETING_ADS: { id: 'MARKETING_ADS', name: 'Meta Ads & Pauta', group: 'MARKETING', groupName: 'Marketing Digital', icon: '🚀', color: '#06b6d4' },
    MARKETING_OTROS: { id: 'MARKETING_OTROS', name: 'Otros Marketing & Branding', group: 'MARKETING', groupName: 'Marketing Digital', icon: '💡', color: '#a855f7' },
    DESARROLLO: { id: 'DESARROLLO', name: 'Desarrollo Web & Software', group: 'DESARROLLO', groupName: 'Desarrollo Web & Software', icon: '💻', color: '#3b82f6' },
    GRABACIONES: { id: 'GRABACIONES', name: 'Grabaciones Extra & Coberturas', group: 'GRABACIONES', groupName: 'Grabaciones & Audiovisual', icon: '🎬', color: '#f59e0b' },
    FORMACION: { id: 'FORMACION', name: 'Formación & Capacitación', group: 'FORMACION', groupName: 'Formación & Capacitación', icon: '🎓', color: '#10b981' },
    MATERIAL_IMPRESO: { id: 'MATERIAL_IMPRESO', name: 'Material Impreso & Rotulados', group: 'MATERIAL_IMPRESO', groupName: 'Material Impreso', icon: '🖨️', color: '#ec4899' },
  };

  const groupMeta: Record<string, { id: string; name: string; icon: string; color: string }> = {
    MARKETING: { id: 'MARKETING', name: 'Marketing Digital Total', icon: '📱', color: '#f97316' },
    DESARROLLO: { id: 'DESARROLLO', name: 'Desarrollo Web & Software', icon: '💻', color: '#3b82f6' },
    GRABACIONES: { id: 'GRABACIONES', name: 'Grabaciones Extra & Coberturas', icon: '🎬', color: '#f59e0b' },
    FORMACION: { id: 'FORMACION', name: 'Formación & Capacitación', icon: '🎓', color: '#10b981' },
    MATERIAL_IMPRESO: { id: 'MATERIAL_IMPRESO', name: 'Material Impreso & Rotulados', icon: '🖨️', color: '#ec4899' },
  };

  function inferCategory(text: string): string {
    const t = (text || '').toLowerCase();
    if (t.includes('ads') || t.includes('pauta') || t.includes('anuncio') || t.includes('facebook') || t.includes('meta ads') || t.includes('google') || t.includes('campaña')) {
      return 'MARKETING_ADS';
    }
    if (t.includes('desarrollo') || t.includes('web') || t.includes('software') || t.includes('sistema') || t.includes('página') || t.includes('landing') || t.includes('portal') || t.includes('tienda') || t.includes('ecommerce') || t.includes('app') || t.includes('bot')) {
      return 'DESARROLLO';
    }
    if (t.includes('grabaci') || t.includes('rodaje') || t.includes('cobertura') || t.includes('video') || t.includes('fotograf') || t.includes('audiovisual')) {
      return 'GRABACIONES';
    }
    if (t.includes('formaci') || t.includes('taller') || t.includes('curso') || t.includes('capacitaci') || t.includes('entrenamiento') || t.includes('clase') || t.includes('workshop')) {
      return 'FORMACION';
    }
    if (t.includes('impres') || t.includes('rotul') || t.includes('pendon') || t.includes('pop') || t.includes('papeler') || t.includes('tarjeta') || t.includes('banner') || t.includes('pulsera')) {
      return 'MATERIAL_IMPRESO';
    }
    if (t.includes('branding') || t.includes('logo') || t.includes('identidad') || t.includes('consultor') || t.includes('auditor') || t.includes('manual de marca')) {
      return 'MARKETING_OTROS';
    }
    return 'MARKETING_RRSS';
  }

  // Obtener todos los documentos en el rango para desglosar sus renglones
  const rangeDocsStmt = db.prepare(`
    SELECT
      id, doc_type, client_id, issue_date, currency, total_amount_currency,
      total_bs_applied, base_usd_bcv, base_bs_bcv, applied_rate, items_json
    FROM documents
    WHERE issue_date >= ? AND issue_date <= ?
    ORDER BY issue_date ASC
  `);
  const rangeDocs = rangeDocsStmt.all(startDate, endDate) as any[];

  const categoryTotals: Record<string, { totalUsd: number; totalBs: number; count: number; clients: Set<string> }> = {};
  for (const k of Object.keys(categoryMeta)) {
    categoryTotals[k] = { totalUsd: 0, totalBs: 0, count: 0, clients: new Set() };
  }

  const monthlyCategoryMap: Record<string, Record<string, number>> = {};
  let totalRangeUsd = 0;
  let totalRangeBs = 0;

  for (const d of rangeDocs) {
    const monthKey = (d.issue_date || '').slice(0, 7);
    if (!monthlyCategoryMap[monthKey]) {
      monthlyCategoryMap[monthKey] = {};
      for (const k of Object.keys(categoryMeta)) {
        monthlyCategoryMap[monthKey][k] = 0;
      }
    }

    let items: any[] = [];
    try {
      if (d.items_json) {
        items = JSON.parse(d.items_json);
      }
    } catch {
      items = [];
    }

    if (!Array.isArray(items) || items.length === 0) {
      items = [{ description: 'Servicio general', amount: d.total_amount_currency, category: 'MARKETING_RRSS' }];
    }

    const docUsd = Number(d.total_amount_currency) || 0;
    const docBs = Number(d.total_bs_applied) || 0;
    totalRangeUsd += docUsd;
    totalRangeBs += docBs;

    const itemsSum = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

    for (const it of items) {
      const catKey = it.category && categoryMeta[it.category] ? it.category : inferCategory(it.description);
      const rawAmt = Number(it.amount) || 0;
      
      // Proporción del renglón respecto al total del documento
      let itUsd = 0;
      if (items.length === 1 || itemsSum <= 0) {
        itUsd = docUsd;
      } else if (itemsSum > 0 && Math.abs(itemsSum - docUsd) < 1) {
        itUsd = rawAmt;
      } else {
        itUsd = (rawAmt / itemsSum) * docUsd;
      }

      const itBs = Number((itUsd * (d.applied_rate || 888.12)).toFixed(2));

      if (categoryTotals[catKey]) {
        categoryTotals[catKey].totalUsd += itUsd;
        categoryTotals[catKey].totalBs += itBs;
        categoryTotals[catKey].count += (Number(it.quantity) || 1);
        if (d.client_id) categoryTotals[catKey].clients.add(d.client_id);
      }

      if (monthlyCategoryMap[monthKey]) {
        monthlyCategoryMap[monthKey][catKey] = (monthlyCategoryMap[monthKey][catKey] || 0) + itUsd;
      }
    }
  }

  // Estructurar desglose por categorías individuales
  const categoryBreakdown = Object.keys(categoryMeta).map((k) => {
    const meta = categoryMeta[k];
    const stat = categoryTotals[k];
    const usd = Number(stat.totalUsd.toFixed(2));
    const bs = Number(stat.totalBs.toFixed(2));
    const percent = totalRangeUsd > 0 ? Number(((usd / totalRangeUsd) * 100).toFixed(1)) : 0;
    const avgTicket = stat.count > 0 ? Number((usd / stat.count).toFixed(2)) : 0;

    return {
      id: meta.id,
      name: meta.name,
      group: meta.group,
      groupName: meta.groupName,
      icon: meta.icon,
      color: meta.color,
      totalUsd: usd,
      totalBs: bs,
      percent,
      count: stat.count,
      uniqueClientsCount: stat.clients.size,
      avgTicketUsd: avgTicket
    };
  }).sort((a, b) => b.totalUsd - a.totalUsd);

  // Estructurar desglose por grandes grupos (Marketing Digital vs Desarrollo vs Grabaciones, etc.)
  const groupTotals: Record<string, { totalUsd: number; totalBs: number; count: number }> = {};
  for (const g of Object.keys(groupMeta)) {
    groupTotals[g] = { totalUsd: 0, totalBs: 0, count: 0 };
  }
  for (const cat of categoryBreakdown) {
    if (groupTotals[cat.group]) {
      groupTotals[cat.group].totalUsd += cat.totalUsd;
      groupTotals[cat.group].totalBs += cat.totalBs;
      groupTotals[cat.group].count += cat.count;
    }
  }

  const groupBreakdown = Object.keys(groupMeta).map((g) => {
    const meta = groupMeta[g];
    const stat = groupTotals[g];
    const usd = Number(stat.totalUsd.toFixed(2));
    const bs = Number(stat.totalBs.toFixed(2));
    const percent = totalRangeUsd > 0 ? Number(((usd / totalRangeUsd) * 100).toFixed(1)) : 0;

    return {
      id: meta.id,
      name: meta.name,
      icon: meta.icon,
      color: meta.color,
      totalUsd: usd,
      totalBs: bs,
      percent,
      count: stat.count
    };
  }).sort((a, b) => b.totalUsd - a.totalUsd);

  // Serie mensual con categorías y grupos para gráficos dinámicos
  const monthlyCategorySeries = Object.keys(monthlyCategoryMap).sort().map((m) => {
    const cats = monthlyCategoryMap[m];
    const monthTotal = Object.values(cats).reduce((acc, v) => acc + v, 0);

    const groups: Record<string, number> = {
      MARKETING: (cats.MARKETING_RRSS || 0) + (cats.MARKETING_ADS || 0) + (cats.MARKETING_OTROS || 0),
      DESARROLLO: cats.DESARROLLO || 0,
      GRABACIONES: cats.GRABACIONES || 0,
      FORMACION: cats.FORMACION || 0,
      MATERIAL_IMPRESO: cats.MATERIAL_IMPRESO || 0,
    };

    return {
      month: m,
      totalUsd: Number(monthTotal.toFixed(2)),
      categories: cats,
      groups
    };
  });

  // Diagnóstico de Áreas Fuertes
  const topCategory = categoryBreakdown[0] || null;
  const topGroup = groupBreakdown[0] || null;
  const runnerUpCategory = categoryBreakdown[1] || null;

  const categoryAnalysis = {
    totalRangeUsd: Number(totalRangeUsd.toFixed(2)),
    totalRangeBs: Number(totalRangeBs.toFixed(2)),
    categoryBreakdown,
    groupBreakdown,
    monthlyCategorySeries,
    topCategory,
    topGroup,
    runnerUpCategory,
    marketingSubcategories: {
      rrssUsd: categoryTotals.MARKETING_RRSS.totalUsd,
      adsUsd: categoryTotals.MARKETING_ADS.totalUsd,
      otrosUsd: categoryTotals.MARKETING_OTROS.totalUsd,
      totalMarketingUsd: groupTotals.MARKETING.totalUsd
    }
  };

  // 7. Pronóstico de Ingreso Mensual Recurrente (MRR) y Flujo de Caja
  // Considera cartera de clientes activos y desglosa deducciones/acuerdos con Isabelle:
  // - Autopartes Los Rosales: $200 cobrados ($100 Isa / $100 Agencia en efectivo)
  // - Odontólogo (Dr. Rony): $250 por acuerdo ($100 a Isabelle a tasa BCV / $150 Agencia)
  // - Arinita: $170 por acuerdo compartido con Isabelle ($85 Isa / $85 Agencia)
  const allActiveClients = db.prepare('SELECT * FROM clients WHERE active = 1 ORDER BY base_monthly_fee DESC, name ASC').all() as any[];
  
  let bcvRate = 888.12;
  const latestRateRow = db.prepare('SELECT bcv_usd FROM exchange_rates ORDER BY date DESC LIMIT 1').get() as any;
  if (latestRateRow?.bcv_usd) bcvRate = Number(latestRateRow.bcv_usd);

  let forecastGrossUsd = 0;
  let sharedIsaDeductionUsd = 0;
  const forecastClientsList: any[] = [];
  const sharedAgreementsList: any[] = [];

  for (const c of allActiveClients) {
    const fee = Number(c.base_monthly_fee) || 0;
    forecastGrossUsd += fee;

    let agencyNet = fee;
    let isaShare = 0;
    let sharedNote: string | null = null;

    if (c.id === 'los-rosales') {
      isaShare = 100;
      agencyNet = 100;
      sharedIsaDeductionUsd += isaShare;
      sharedNote = 'Cliente compartido con Isabelle: $100 Isa en efectivo / $100 Agencia';
      sharedAgreementsList.push({
        id: c.id,
        name: c.name,
        total_fee: fee,
        isa_share: isaShare,
        agency_net: agencyNet,
        payment_condition: 'Efectivo USD ($100 Isa / $100 Agencia)',
        note: sharedNote
      });
    } else if (c.id === 'odontologo-rony') {
      isaShare = 100;
      agencyNet = 150;
      sharedIsaDeductionUsd += isaShare;
      sharedNote = 'Acuerdo $250: $100 pagaderos a Isabelle a tasa oficial BCV / $150 Agencia';
      sharedAgreementsList.push({
        id: c.id,
        name: c.name,
        total_fee: fee,
        isa_share: isaShare,
        agency_net: agencyNet,
        payment_condition: '$100 a Isa a tasa oficial BCV',
        note: sharedNote
      });
    } else if (c.id === 'arinita') {
      isaShare = 0; // Sin pago en dinero de la agencia a Isa
      agencyNet = 85; // $85 en mercancía percibida para la agencia
      sharedNote = 'Intercambio en mercancía ($170): $85 Isa / $85 Agencia (Sin desembolso de dinero a Isa)';
      sharedAgreementsList.push({
        id: c.id,
        name: c.name,
        total_fee: fee,
        isa_share: 0,
        isa_merchandise: 85,
        agency_net: agencyNet,
        payment_condition: 'Intercambio: $85 en mercancía c/u (Sin pago de dinero)',
        note: sharedNote
      });
    }

    forecastClientsList.push({
      id: c.id,
      name: c.name,
      business_name: c.business_name,
      billing_day: c.billing_day,
      total_fee_usd: fee,
      agency_net_usd: agencyNet,
      shared_isa_usd: isaShare,
      default_rate_type: c.default_rate_type,
      is_withholding_agent: c.is_withholding_agent === 1,
      shared_note: sharedNote
    });
  }

  // Ingreso Neto Agencia: Suma del beneficio neto de cada cliente (incluye $85 en mercancía)
  let forecastNetAgencyUsd = 0;
  for (const fc of forecastClientsList) {
    forecastNetAgencyUsd += Number(fc.agency_net_usd) || 0;
  }
  const forecastNetAgencyBs = Number((forecastNetAgencyUsd * bcvRate).toFixed(2));
  const forecastGrossBs = Number((forecastGrossUsd * bcvRate).toFixed(2));
  const sharedIsaDeductionBs = Number((sharedIsaDeductionUsd * bcvRate).toFixed(2));

  const monthlyForecast = {
    grossTotalUsd: forecastGrossUsd,
    grossTotalBs: forecastGrossBs,
    sharedIsaDeductionUsd, // $200 (Autopartes $100 efectivo + Rony $100 a BCV)
    sharedIsaDeductionBs,
    sharedIsaMerchandiseUsd: 85, // $85 en mercancía directa para Isa
    netAgencyUsd: forecastNetAgencyUsd, // $3.530 ($3.445 dinero + $85 mercancía)
    netAgencyBs: forecastNetAgencyBs,
    bcvRateApplied: bcvRate,
    totalClientsCount: allActiveClients.length,
    forecastClientsList,
    sharedAgreementsList
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
    categoryAnalysis,
    clientBreakdown,
    pendingDebts
  });
}
