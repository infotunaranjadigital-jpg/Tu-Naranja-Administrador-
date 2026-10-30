'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Calendar, DollarSign, 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ShieldCheck, History, Award, AlertCircle, RefreshCw,
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, Info, Handshake,
  Search, ArrowUpDown, Filter, PieChart, Layers, Target,
  Laptop, Video, GraduationCap, Printer, Megaphone, Smartphone
} from 'lucide-react';

export default function ReportsView() {
  // Rango de fechas
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;

  // Rango por defecto: Año en curso
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // Comparativa de meses
  const [compareMonthA, setCompareMonthA] = useState(`${currentYear}-${String(currentMonthNum).padStart(2, '0')}`);
  const [compareMonthB, setCompareMonthB] = useState(`${currentYear - 1}-${String(currentMonthNum).padStart(2, '0')}`);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForecastList, setShowForecastList] = useState(false);

  // Filtro y ordenamiento en tabla de clientes
  const [tableSearch, setTableSearch] = useState('');
  const [tableSort, setTableSort] = useState<'fee_desc' | 'fee_asc' | 'invoiced_desc' | 'invoiced_asc' | 'docs_desc' | 'name_asc'>('fee_desc');

  // Filtro de categoría en gráfico dinámico (Estilo Notion)
  const [selectedAreaTab, setSelectedAreaTab] = useState<string>('ALL');
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<string | null>(null);
  const [chartViewMode, setChartViewMode] = useState<'pie' | 'bars'>('pie');
  const [hoveredCategory, setHoveredCategory] = useState<any | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `/api/reports?startDate=${startDate}&endDate=${endDate}&compareMonthA=${compareMonthA}&compareMonthB=${compareMonthB}`;
      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch {
      alert('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, compareMonthA, compareMonthB]);

  const formatBs = (num: number) => (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Presets de rango
  const setPresetRange = (preset: '3M' | '6M' | 'YTD' | 'LAST_YEAR') => {
    const now = new Date();
    if (preset === '3M') {
      const d = new Date();
      d.setMonth(now.getMonth() - 2);
      d.setDate(1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === '6M') {
      const d = new Date();
      d.setMonth(now.getMonth() - 5);
      d.setDate(1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'YTD') {
      setStartDate(`${now.getFullYear()}-01-01`);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'LAST_YEAR') {
      const lastY = now.getFullYear() - 1;
      setStartDate(`${lastY}-01-01`);
      setEndDate(`${lastY}-12-31`);
    }
  };

  const exportToCSV = () => {
    if (!reportData?.clientBreakdown) return;
    const headers = ['Cliente', 'Tarifa Actual ($)', 'Documentos Emitidos', 'Total Facturado Bs', 'Unidad Base Oficial Bs', 'Unidad Base Oficial USD', 'Ultimo Ajuste Tarifa'];
    const rows = reportData.clientBreakdown.map((c: any) => [
      `"${c.name}"`,
      c.base_monthly_fee,
      c.doc_count || 0,
      c.total_bs_applied || 0,
      c.total_base_bs_bcv || 0,
      c.total_base_usd_bcv || 0,
      `"${c.last_fee_adjustment || 'Sin cambios'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_facturacion_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nombres de meses en español
  const getMonthName = (mStr: string) => {
    if (!mStr) return '';
    const [y, m] = mStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  };

  const monthlySeries = reportData?.monthlySeries || [];
  const maxSeriesVal = Math.max(...monthlySeries.map((s: any) => s.total_base_usd_bcv || 0), 100);

  const sortedClientBreakdown = (reportData?.clientBreakdown || [])
    .filter((c: any) => {
      const term = tableSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        (c.business_name || '').toLowerCase().includes(term)
      );
    })
    .sort((a: any, b: any) => {
      if (tableSort === 'fee_desc') {
        return (Number(b.base_monthly_fee) || 0) - (Number(a.base_monthly_fee) || 0);
      }
      if (tableSort === 'fee_asc') {
        return (Number(a.base_monthly_fee) || 0) - (Number(b.base_monthly_fee) || 0);
      }
      if (tableSort === 'invoiced_desc') {
        return (Number(b.total_base_usd_bcv) || 0) - (Number(a.total_base_usd_bcv) || 0);
      }
      if (tableSort === 'invoiced_asc') {
        return (Number(a.total_base_usd_bcv) || 0) - (Number(b.total_base_usd_bcv) || 0);
      }
      if (tableSort === 'docs_desc') {
        return (Number(b.doc_count) || 0) - (Number(a.doc_count) || 0);
      }
      if (tableSort === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Header & Date Range Selectors */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Reportes de Facturación Mes a Mes (Unidad Base BCV)
            </h2>
            <p className="text-xs text-slate-400">
              Analiza el volumen real facturado por rango de fechas y compara meses sin distorsión cambiaria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-4 h-4 text-orange-400" />
              Rango:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono outline-none"
            />
            <span className="text-slate-500">hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-2.5 py-1.5 text-slate-200 font-mono outline-none"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setPresetRange('3M')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-medium transition"
            >
              Últimos 3 Meses
            </button>
            <button
              onClick={() => setPresetRange('6M')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-medium transition"
            >
              Últimos 6 Meses
            </button>
            <button
              onClick={() => setPresetRange('YTD')}
              className="px-2.5 py-1 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg text-orange-300 font-bold transition"
            >
              Año 2026
            </button>
            <button
              onClick={() => setPresetRange('LAST_YEAR')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-medium transition"
            >
              Año 2025
            </button>
          </div>
        </div>
      </div>

      {/* 🔮 Pronóstico de Ingreso Mensual Recurrente (MRR) */}
      {reportData?.monthlyForecast && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Pronóstico Fijo Recurrente (MRR)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Tasa BCV Aplicada: Bs. {formatBs(reportData.monthlyForecast.bcvRateApplied)}
                </span>
              </div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Pronóstico de Ingreso Mensual
              </h3>
              <p className="text-xs text-slate-400">
                Suma estimada recurrente mensual de clientes activos. Excluye convenios/acuerdos y deduce montos compartidos.
              </p>
            </div>

            <button
              onClick={() => setShowForecastList(!showForecastList)}
              className="self-start lg:self-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {showForecastList ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-orange-400" />}
              {showForecastList ? 'Ocultar Desglose de Clientes' : 'Ver Desglose de Clientes'}
            </button>
          </div>

          {/* Forecast Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Neto Agencia */}
            <div className="bg-slate-950/90 border border-emerald-500/40 p-4 rounded-xl shadow-lg">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                ★ Ingreso Neto Agencia / Mes
              </span>
              <div className="text-2xl font-black text-white font-mono">
                ${reportData.monthlyForecast.netAgencyUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-sans text-emerald-400">USD</span>
              </div>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                Bs. {formatBs(reportData.monthlyForecast.netAgencyBs)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                Flujo de caja recurrente neto de Tu Naranja Digital
              </div>
            </div>

            {/* Total Bruto Recurrente */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Facturación Total Cartera
              </span>
              <div className="text-2xl font-black text-slate-200 font-mono">
                ${reportData.monthlyForecast.grossTotalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-sans text-slate-400">USD</span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Bs. {formatBs(reportData.monthlyForecast.grossTotalBs)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                {reportData.monthlyForecast.totalClientsCount || reportData.monthlyForecast.forecastClientsList?.length} clientes activos
              </div>
            </div>

            {/* Deducciones / Pagos Compartidos a Isabelle */}
            <div className="bg-slate-950/70 border border-amber-500/30 p-4 rounded-xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                <span>Pagos en Dinero a Isa</span>
                <Handshake className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                -${reportData.monthlyForecast.sharedIsaDeductionUsd.toFixed(2)}{' '}
                <span className="text-xs font-sans text-amber-400/80">USD</span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium mt-1">
                Autopartes ($100 efectivo) + Rony ($100 BCV)
              </p>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                Arinita: $85 en mercancía directa a Isa (sin pago de dinero)
              </div>
            </div>

            {/* Tasa Oficial BCV */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Tasa Oficial BCV Aplicada</span>
                <DollarSign className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400 font-mono">
                {formatBs(reportData.monthlyForecast.bcvRateApplied)}{' '}
                <span className="text-xs font-sans text-slate-400">Bs./$</span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Conversión en tiempo real
              </p>
              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                Sincronizada con Banco Central de Venezuela
              </div>
            </div>
          </div>

          {/* Observaciones Específicas / Reglas Clave */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-base leading-none">🤝</span>
              <div className="text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Autopartes Los Rosales ($200)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Cobro de <strong>$200 en efectivo</strong>: <strong>$100 corresponden a Isabelle</strong> y <strong>$100 a la agencia</strong>.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-base leading-none">🤝</span>
              <div className="text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Odontólogo - Dr. Rony ($250)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Acuerdo de <strong>$250</strong>. De este cliente se pagan <strong>$100 a Isabelle a tasa oficial BCV</strong> (quedan <strong>$150</strong> netos a la agencia).
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-base leading-none">📦</span>
              <div className="text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Arinita ($170 en Mercancía)</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Acuerdo de intercambio: Los 2 reciben <strong>$85 en mercancía cada uno</strong> ($85 Isa / $85 Agencia). <strong>No hay desembolso de dinero a Isabelle</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Desglose desplegable de clientes en el pronóstico */}
          {showForecastList && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Listado Detallado de Clientes en el Pronóstico ({reportData.monthlyForecast.forecastClientsList.length} clientes regulares)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[...reportData.monthlyForecast.forecastClientsList]
                  .sort((a: any, b: any) => (Number(b.agency_net_usd) || 0) - (Number(a.agency_net_usd) || 0))
                  .map((fc: any) => (
                  <div key={fc.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{fc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Corte: Día {fc.billing_day} • Tasa {fc.default_rate_type}
                      </div>
                      {fc.shared_note && (
                        <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                          {fc.shared_note}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-black text-emerald-400">
                        ${fc.agency_net_usd}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          {fc.id === 'arinita' ? 'Mercancía' : 'Neto'}
                        </span>
                      </div>
                      {fc.shared_isa_usd > 0 ? (
                        <div className="text-[10px] text-amber-400">($100 Isa)</div>
                      ) : fc.id === 'arinita' ? (
                        <div className="text-[10px] text-amber-300">($85 Mercancía Isa)</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards in the selected date range */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total en Rango (Base BCV)
            </span>
            <div className="text-2xl font-black text-white font-mono">
              ${(reportData.totals?.total_base_usd_bcv || 0).toFixed(2)} <span className="text-xs font-sans text-slate-400">USD</span>
            </div>
            <p className="text-xs text-orange-400 font-mono mt-1">
              Bs. {formatBs(reportData.totals?.total_base_bs_bcv)}
            </p>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
              {reportData.totals?.total_documents || 0} facturas/recibos emitidos
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cobrado vs Pendiente
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${(reportData.totals?.collected_usd || 0).toFixed(2)} <span className="text-xs text-slate-400 font-sans">Cobrado</span>
            </div>
            <p className="text-xs text-amber-400 font-mono mt-1">
              ${(reportData.totals?.pending_usd || 0).toFixed(2)} Pendiente
            </p>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
              {((((reportData.totals?.collected_usd || 0) / (reportData.totals?.total_usd || 1)) * 100) || 0).toFixed(0)}% cobrado
            </div>
          </div>

          {/* Mes Pico */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              <span>★ Mes con Mayor Facturación</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {reportData.stats?.peakMonth ? getMonthName(reportData.stats.peakMonth) : 'N/A'}
            </div>
            <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
              ${(reportData.stats?.peakAmount || 0).toFixed(2)} USD Oficial
            </p>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
              Pico de ingresos en el rango
            </div>
          </div>

          {/* Mes Menor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <span>Mes con Menor Facturación</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-slate-200">
              {reportData.stats?.lowestMonth ? getMonthName(reportData.stats.lowestMonth) : 'N/A'}
            </div>
            <p className="text-xs font-mono font-bold text-amber-400 mt-1">
              ${(reportData.stats?.lowestAmount || 0).toFixed(2)} USD Oficial
            </p>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
              Mínimo registrado
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Análisis Dinámico de Ingresos por Áreas y Líneas de Negocio (Estilo Notion) */}
      {reportData?.categoryAnalysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Header de Áreas de Negocio */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Líneas de Negocio & Áreas Fuertes
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Facturación Total: ${reportData.categoryAnalysis.totalRangeUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📈 Diagnóstico de Facturación por Especialidad (Notion Style)
              </h3>
              <p className="text-xs text-slate-400">
                Conoce exactamente cuánto dinero ingresa por Marketing (Redes vs Ads vs Otros), Desarrollo Web, Grabaciones, Formación y Material Impreso.
              </p>
            </div>

            {/* Selector de Pestañas / Filtro de Área para el Gráfico */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedAreaTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedAreaTab === 'ALL'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Todas las Áreas
              </button>

              <button
                onClick={() => setSelectedAreaTab('MARKETING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedAreaTab === 'MARKETING'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>📱</span>
                Marketing (Redes + Ads)
              </button>

              <button
                onClick={() => setSelectedAreaTab('DESARROLLO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedAreaTab === 'DESARROLLO'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>💻</span>
                Desarrollo Web
              </button>

              <button
                onClick={() => setSelectedAreaTab('GRABACIONES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedAreaTab === 'GRABACIONES'
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🎬</span>
                Grabaciones
              </button>

              <button
                onClick={() => setSelectedAreaTab('FORMACION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedAreaTab === 'FORMACION'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🎓</span>
                Formación
              </button>

              <button
                onClick={() => setSelectedAreaTab('MATERIAL_IMPRESO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedAreaTab === 'MATERIAL_IMPRESO'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🖨️</span>
                Material Impreso
              </button>
            </div>
          </div>

          {/* Tarjetas Diagnósticas de Áreas Fuertes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Medalla de Oro: Área Líder */}
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  👑 Tu Área Más Fuerte (Líder en Ventas)
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {reportData.categoryAnalysis.topCategory?.percent}% del Total
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{reportData.categoryAnalysis.topCategory?.icon}</span>
                <h4 className="text-base font-black text-white">
                  {reportData.categoryAnalysis.topCategory?.name}
                </h4>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-300 font-mono">
                  ${reportData.categoryAnalysis.topCategory?.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Bs. {formatBs(reportData.categoryAnalysis.topCategory?.totalBs)})
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Ticket Promedio: <strong className="text-slate-200">${reportData.categoryAnalysis.topCategory?.avgTicketUsd}</strong></span>
                <span>{reportData.categoryAnalysis.topCategory?.count} servicios emitidos</span>
              </div>
            </div>

            {/* Desglose Especial: Marketing Digital (Redes vs Ads vs Otros) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📱</span>
                  Desglose de Marketing Digital
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  ${(reportData.categoryAnalysis.marketingSubcategories?.totalMarketingUsd || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD
                </span>
              </div>

              <div className="space-y-2 mt-2">
                {/* Redes Sociales */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                    <span>Manejo de Redes (RRSS)</span>
                  </div>
                  <span className="font-mono font-bold text-orange-400">
                    ${(reportData.categoryAnalysis.marketingSubcategories?.rrssUsd || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Meta Ads */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                    <span>Meta Ads & Pauta</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400">
                    ${(reportData.categoryAnalysis.marketingSubcategories?.adsUsd || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Otros Marketing */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    <span>Branding / Consultoría</span>
                  </div>
                  <span className="font-mono font-bold text-purple-400">
                    ${(reportData.categoryAnalysis.marketingSubcategories?.otrosUsd || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800">
                Pauta y redes representan la mayor recurrencia mensual.
              </div>
            </div>

            {/* Medalla de Plata: Segunda Área Fuerte */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🥈</span>
                  Segunda Área con Mayor Aporte
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {reportData.categoryAnalysis.runnerUpCategory?.percent}% del Total
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{reportData.categoryAnalysis.runnerUpCategory?.icon}</span>
                <h4 className="text-base font-black text-white">
                  {reportData.categoryAnalysis.runnerUpCategory?.name}
                </h4>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-200 font-mono">
                  ${reportData.categoryAnalysis.runnerUpCategory?.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Bs. {formatBs(reportData.categoryAnalysis.runnerUpCategory?.totalBs)})
                </span>
              </div>

              <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Ticket Promedio: <strong className="text-slate-200">${reportData.categoryAnalysis.runnerUpCategory?.avgTicketUsd}</strong></span>
                <span>{reportData.categoryAnalysis.runnerUpCategory?.count} servicios emitidos</span>
              </div>
            </div>
          </div>

          {/* Barra Continua Multicolor de Distribución (%) */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-orange-400" />
                Distribución Proporcional de Ingresos en el Período
              </span>
              <span className="text-xs text-slate-400">100% de la facturación</span>
            </div>

            {/* Barra acumulada */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
              {reportData.categoryAnalysis.categoryBreakdown.map((cat: any) => {
                if (cat.percent <= 0) return null;
                return (
                  <div
                    key={cat.id}
                    title={`${cat.name}: $${cat.totalUsd} (${cat.percent}%)`}
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    className="h-full transition-all duration-300 hover:brightness-125 cursor-pointer"
                  />
                );
              })}
            </div>

            {/* Leyenda interactiva */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              {reportData.categoryAnalysis.categoryBreakdown.map((cat: any) => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedAreaTab(cat.id === 'MARKETING_RRSS' || cat.id === 'MARKETING_ADS' || cat.id === 'MARKETING_OTROS' ? 'MARKETING' : cat.id)}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300">{cat.name}:</span>
                  <span className="font-mono font-bold text-white">${cat.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</span>
                  <span className="text-slate-400 text-[10px]">({cat.percent}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico Dinámico: Torta (Pie Chart) o Barras Apiladas */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{chartViewMode === 'pie' ? '🥧' : '📊'}</span>
                  <span>
                    {chartViewMode === 'pie' 
                      ? 'Distribución de Ingresos por Categoría (Gráfico de Torta)' 
                      : `Evolución Mensual por Categoría (${selectedAreaTab === 'ALL' ? 'Todas las Áreas' : selectedAreaTab})`}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {chartViewMode === 'pie'
                    ? 'Pasa el cursor sobre los segmentos de la torta para ver el aporte de cada servicio.'
                    : 'Pasa el cursor o haz click sobre cada mes para ver el desglose exacto de servicios.'}
                </p>
              </div>

              {/* Controles: Selector de modo (Torta vs Barras) y Limpiar mes */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedMonthDetail && (
                  <button
                    onClick={() => setSelectedMonthDetail(null)}
                    className="text-[11px] px-2.5 py-1 bg-slate-900 border border-slate-700 text-orange-400 hover:text-orange-300 rounded-lg flex items-center gap-1 transition"
                  >
                    <span>Limpiar mes ({getMonthName(selectedMonthDetail)})</span>
                    <span className="text-xs">✕</span>
                  </button>
                )}

                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('pie')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      chartViewMode === 'pie'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Torta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('bars')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      chartViewMode === 'bars'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Barras</span>
                  </button>
                </div>
              </div>
            </div>

            {/* VISTA 1: GRÁFICO DE TORTA / DONUT CHART */}
            {chartViewMode === 'pie' && (() => {
              // Calcular datos de los slices
              const breakdown = reportData.categoryAnalysis.categoryBreakdown || [];
              let activeItems = breakdown.filter((c: any) => c.totalUsd > 0);

              if (selectedMonthDetail) {
                const mData = reportData.categoryAnalysis.monthlyCategorySeries.find((s: any) => s.month === selectedMonthDetail);
                if (mData) {
                  activeItems = breakdown
                    .map((c: any) => {
                      const usd = mData.categories?.[c.id] || 0;
                      return {
                        ...c,
                        totalUsd: usd,
                        totalBs: Number((usd * (reportData.kpis?.avgBcvRate || 888)).toFixed(2)),
                        percent: mData.totalUsd > 0 ? Number(((usd / mData.totalUsd) * 100).toFixed(1)) : 0
                      };
                    })
                    .filter((c: any) => c.totalUsd > 0);
                }
              }

              const totalPieUsd = activeItems.reduce((acc: number, c: any) => acc + (c.totalUsd || 0), 0);
              const totalPieBs = activeItems.reduce((acc: number, c: any) => acc + (c.totalBs || 0), 0);

              if (totalPieUsd <= 0 || activeItems.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    No hay ingresos registrados para mostrar el gráfico de torta en este rango.
                  </div>
                );
              }

              // Preparar arcos matemáticos
              let runningPercent = 0;
              const slices = activeItems.map((c: any) => {
                const slicePercent = c.totalUsd / totalPieUsd;
                const startPercent = runningPercent;
                runningPercent += slicePercent;
                const endPercent = runningPercent;
                return {
                  ...c,
                  slicePercent,
                  startPercent,
                  endPercent,
                  percentNum: (slicePercent * 100).toFixed(1)
                };
              });

              // Coordenadas trigonométricas para Donut SVG
              const cx = 130;
              const cy = 130;
              const outerRadius = 100;
              const innerRadius = 62;

              const getCoords = (p: number, r: number) => {
                const angle = (p * 2 * Math.PI) - (Math.PI / 2);
                return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
              };

              const createPath = (startP: number, endP: number) => {
                if (endP - startP >= 0.999) {
                  return [
                    `M ${cx} ${cy - outerRadius}`,
                    `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius}`,
                    `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy - outerRadius}`,
                    `M ${cx} ${cy - innerRadius}`,
                    `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy + innerRadius}`,
                    `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius}`,
                    'Z'
                  ].join(' ');
                }

                const [sX, sY] = getCoords(startP, outerRadius);
                const [eX, eY] = getCoords(endP, outerRadius);
                const [inSx, inSy] = getCoords(endP, innerRadius);
                const [inEx, inEy] = getCoords(startP, innerRadius);
                const largeArc = (endP - startP) > 0.5 ? 1 : 0;

                return [
                  `M ${sX} ${sY}`,
                  `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${eX} ${eY}`,
                  `L ${inSx} ${inSy}`,
                  `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${inEx} ${inEy}`,
                  'Z'
                ].join(' ');
              };

              const currentHover = hoveredCategory || slices[0];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Donut SVG Interactivo */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                    <svg
                      viewBox="0 0 260 260"
                      className="w-full max-w-[270px] h-auto drop-shadow-xl select-none"
                    >
                      {/* Fondo de dona vacío por si acaso */}
                      <circle cx={cx} cy={cy} r={outerRadius} fill="none" stroke="#1e293b" strokeWidth="38" />

                      {/* Slices de la torta */}
                      {slices.map((slice: any) => {
                        const isHovered = hoveredCategory?.id === slice.id;
                        return (
                          <path
                            key={slice.id}
                            d={createPath(slice.startPercent, slice.endPercent)}
                            fill={slice.color}
                            stroke="#020617"
                            strokeWidth="2.5"
                            className="transition-all duration-200 cursor-pointer origin-center"
                            style={{
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                              transformOrigin: `${cx}px ${cy}px`,
                              filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 8px rgba(0,0,0,0.5))' : 'none',
                              opacity: hoveredCategory && !isHovered ? 0.6 : 1
                            }}
                            onMouseEnter={() => setHoveredCategory(slice)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            onClick={() => setSelectedAreaTab(slice.id === 'MARKETING_RRSS' || slice.id === 'MARKETING_ADS' || slice.id === 'MARKETING_OTROS' ? 'MARKETING' : slice.id)}
                          />
                        );
                      })}

                      {/* Centro interactivo de la dona */}
                      <circle cx={cx} cy={cy} r={innerRadius - 4} fill="#090d16" />

                      {/* Textos centrales */}
                      <g className="text-center pointer-events-none" textAnchor="middle">
                        {hoveredCategory ? (
                          <>
                            <text x={cx} y={cy - 20} className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                              {hoveredCategory.icon} {hoveredCategory.name.length > 18 ? hoveredCategory.name.slice(0, 16) + '…' : hoveredCategory.name}
                            </text>
                            <text x={cx} y={cy + 3} className="fill-white font-mono font-black text-[18px]">
                              ${hoveredCategory.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                            </text>
                            <text x={cx} y={cy + 22} className="fill-orange-400 font-mono font-bold text-[12px]">
                              {hoveredCategory.percentNum || hoveredCategory.percent}%
                            </text>
                          </>
                        ) : (
                          <>
                            <text x={cx} y={cy - 18} className="fill-slate-400 text-[10px] uppercase font-bold tracking-wider">
                              {selectedMonthDetail ? getMonthName(selectedMonthDetail) : 'Total Período'}
                            </text>
                            <text x={cx} y={cy + 6} className="fill-white font-mono font-black text-[19px]">
                              ${totalPieUsd.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                            </text>
                            <text x={cx} y={cy + 24} className="fill-slate-400 text-[10px] font-medium">
                              USD Facturados
                            </text>
                          </>
                        )}
                      </g>
                    </svg>

                    <div className="mt-3 text-center">
                      <span className="text-[11px] text-slate-400">
                        {selectedMonthDetail ? (
                          <span className="text-orange-400 font-medium">Mes: {getMonthName(selectedMonthDetail)}</span>
                        ) : (
                          <span>Distribución consolidada del negocio</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Leyenda y Desglose Visual Tipo Notion */}
                  <div className="lg:col-span-7 flex flex-col gap-2.5">
                    {slices.map((cat: any) => {
                      const isHovered = hoveredCategory?.id === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onMouseEnter={() => setHoveredCategory(cat)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          onClick={() => setSelectedAreaTab(cat.id === 'MARKETING_RRSS' || cat.id === 'MARKETING_ADS' || cat.id === 'MARKETING_OTROS' ? 'MARKETING' : cat.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isHovered
                              ? 'bg-slate-900 border-orange-500/60 shadow-lg scale-[1.01]'
                              : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Icono + Nombre */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div className="truncate">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                                  <span>{cat.icon}</span>
                                  <span className="truncate">{cat.name}</span>
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {cat.clientCount || cat.count} {cat.clientCount === 1 ? 'cliente' : 'clientes / servicios'}
                                </span>
                              </div>
                            </div>

                            {/* Monto USD + Porcentaje Badge */}
                            <div className="text-right flex items-center gap-3 flex-shrink-0">
                              <div>
                                <div className="font-mono font-bold text-sm text-white">
                                  ${cat.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  Bs. {formatBs(cat.totalBs)}
                                </div>
                              </div>
                              <span
                                className="font-mono font-bold text-xs px-2 py-1 rounded-md text-white min-w-[50px] text-center"
                                style={{ backgroundColor: `${cat.color}33`, color: cat.color, border: `1px solid ${cat.color}66` }}
                              >
                                {cat.percentNum || cat.percent}%
                              </span>
                            </div>
                          </div>

                          {/* Mini Barra de Progreso */}
                          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${cat.percentNum || cat.percent}%`,
                                backgroundColor: cat.color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* VISTA 2: GRÁFICO DE BARRAS MENSUALES APILADAS */}
            {chartViewMode === 'bars' && (
              <div>
                {reportData.categoryAnalysis.monthlyCategorySeries.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No hay movimientos registrados en este período.
                  </div>
                ) : (
                  <div>
                    {(() => {
                      const series = reportData.categoryAnalysis.monthlyCategorySeries;
                      let maxVal = 100;
                      series.forEach((s: any) => {
                        let v = s.totalUsd;
                        if (selectedAreaTab === 'MARKETING') v = s.groups?.MARKETING || 0;
                        else if (selectedAreaTab !== 'ALL') v = s.categories?.[selectedAreaTab] || 0;
                        if (v > maxVal) maxVal = v;
                      });

                      return (
                        <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800 overflow-x-auto">
                          {series.map((s: any) => {
                            let activeVal = s.totalUsd;
                            if (selectedAreaTab === 'MARKETING') activeVal = s.groups?.MARKETING || 0;
                            else if (selectedAreaTab !== 'ALL') activeVal = s.categories?.[selectedAreaTab] || 0;

                            const heightPercent = Math.max(Math.round((activeVal / maxVal) * 100), 6);
                            const isSelected = selectedMonthDetail === s.month;

                            return (
                              <div
                                key={s.month}
                                onClick={() => setSelectedMonthDetail(isSelected ? null : s.month)}
                                className="flex-1 min-w-[70px] flex flex-col items-center gap-2 group h-full justify-end cursor-pointer"
                              >
                                <div className="text-[11px] font-mono font-bold text-slate-200 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition">
                                  ${activeVal.toFixed(0)}
                                </div>

                                <div
                                  className={`w-full max-w-[48px] rounded-t-xl overflow-hidden flex flex-col-reverse transition-all duration-300 relative ${
                                    isSelected ? 'ring-2 ring-orange-400 brightness-110 shadow-lg' : 'hover:brightness-110'
                                  }`}
                                  style={{ height: `${heightPercent}%` }}
                                >
                                  {selectedAreaTab === 'ALL' ? (
                                    <>
                                      {reportData.categoryAnalysis.categoryBreakdown.map((cat: any) => {
                                        const catUsd = s.categories?.[cat.id] || 0;
                                        if (catUsd <= 0 || s.totalUsd <= 0) return null;
                                        const segHeight = (catUsd / s.totalUsd) * 100;
                                        return (
                                          <div
                                            key={cat.id}
                                            style={{ height: `${segHeight}%`, backgroundColor: cat.color }}
                                            title={`${cat.name}: $${catUsd.toFixed(2)}`}
                                            className="w-full"
                                          />
                                        );
                                      })}
                                    </>
                                  ) : selectedAreaTab === 'MARKETING' ? (
                                    <>
                                      {s.categories?.MARKETING_RRSS > 0 && (
                                        <div style={{ height: `${(s.categories.MARKETING_RRSS / activeVal) * 100}%`, backgroundColor: '#f97316' }} />
                                      )}
                                      {s.categories?.MARKETING_ADS > 0 && (
                                        <div style={{ height: `${(s.categories.MARKETING_ADS / activeVal) * 100}%`, backgroundColor: '#06b6d4' }} />
                                      )}
                                      {s.categories?.MARKETING_OTROS > 0 && (
                                        <div style={{ height: `${(s.categories.MARKETING_OTROS / activeVal) * 100}%`, backgroundColor: '#a855f7' }} />
                                      )}
                                    </>
                                  ) : (
                                    <div
                                      className="w-full h-full"
                                      style={{
                                        backgroundColor:
                                          selectedAreaTab === 'DESARROLLO' ? '#3b82f6' :
                                          selectedAreaTab === 'GRABACIONES' ? '#f59e0b' :
                                          selectedAreaTab === 'FORMACION' ? '#10b981' : '#ec4899'
                                      }}
                                    />
                                  )}
                                </div>

                                <div className={`text-[11px] font-semibold mt-1 whitespace-nowrap ${
                                  isSelected ? 'text-orange-400 font-bold' : 'text-slate-400'
                                }`}>
                                  {getMonthName(s.month)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Tarjeta de Detalle del Mes Seleccionado en modo barras */}
                    {selectedMonthDetail && (() => {
                      const mData = reportData.categoryAnalysis.monthlyCategorySeries.find((s: any) => s.month === selectedMonthDetail);
                      if (!mData) return null;
                      return (
                        <div className="mt-4 p-4 bg-slate-900 border border-orange-500/40 rounded-xl animate-in fade-in">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                              <span>🔍</span>
                              Desglose Detallado de {getMonthName(mData.month)}
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              Total Mes: ${mData.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                            {reportData.categoryAnalysis.categoryBreakdown.map((cat: any) => {
                              const amt = mData.categories?.[cat.id] || 0;
                              return (
                                <div key={cat.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                                  <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                                    <span>{cat.icon}</span>
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  <div className="font-mono font-bold text-sm text-white mt-1">
                                    ${amt.toFixed(2)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabla de Desglose por Línea de Negocio (Estilo Notion) */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>📑</span>
                  Tabla de Desglose por Línea de Negocio (Estilo Notion)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Detalle consolidado de tickets, volumen emitido y facturación en USD y Bolívares.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                    <th className="py-2.5 px-3 text-left">Área / Categoría</th>
                    <th className="py-2.5 px-3 text-left">Grupo Principal</th>
                    <th className="py-2.5 px-3 text-right">Facturado ($ USD)</th>
                    <th className="py-2.5 px-3 text-right">Facturado (Bs.)</th>
                    <th className="py-2.5 px-3 text-right">% Cuota</th>
                    <th className="py-2.5 px-3 text-right">Servicios</th>
                    <th className="py-2.5 px-3 text-right">Clientes Únicos</th>
                    <th className="py-2.5 px-3 text-right">Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {reportData.categoryAnalysis.categoryBreakdown.map((cat: any, idx: number) => (
                    <tr key={cat.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3 text-left font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              {cat.name}
                              {idx === 0 && <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded">Líder</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-left font-sans text-slate-400">
                        {cat.groupName}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-emerald-400">
                        ${cat.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-300">
                        Bs. {formatBs(cat.totalBs)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-orange-400">
                        {cat.percent}%
                      </td>

                      <td className="py-3 px-3 text-right text-slate-300">
                        {cat.count}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-300">
                        {cat.uniqueClientsCount}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-200">
                        ${cat.avgTicketUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Comparativa Detallada: Mes A vs Mes B (ej. Octubre 2026 vs Octubre 2025) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              ⚖️ Comparativa Directa entre Dos Meses
            </h3>
            <p className="text-xs text-slate-400">
              Compara cualquier mes contra el mismo mes del año pasado o cualquier otro período.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Mes A:</span>
            <input
              type="month"
              value={compareMonthA}
              onChange={(e) => setCompareMonthA(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 font-mono outline-none"
            />
            <span className="text-slate-400 ml-2">vs Mes B:</span>
            <input
              type="month"
              value={compareMonthB}
              onChange={(e) => setCompareMonthB(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-200 font-mono outline-none"
            />
          </div>
        </div>

        {reportData?.comparison && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Mes A */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                {getMonthName(reportData.comparison.monthA.label)}
              </span>
              <div className="text-xl font-black font-mono text-white">
                ${(reportData.comparison.monthA.total_base_usd_bcv || 0).toFixed(2)} <span className="text-xs font-sans text-slate-400">USD BCV</span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Bs. {formatBs(reportData.comparison.monthA.total_base_bs_bcv)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                {reportData.comparison.monthA.docs_count || 0} documentos emitidos
              </div>
            </div>

            {/* Mes B */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                {getMonthName(reportData.comparison.monthB.label)}
              </span>
              <div className="text-xl font-black font-mono text-white">
                ${(reportData.comparison.monthB.total_base_usd_bcv || 0).toFixed(2)} <span className="text-xs font-sans text-slate-400">USD BCV</span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Bs. {formatBs(reportData.comparison.monthB.total_base_bs_bcv)}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                {reportData.comparison.monthB.docs_count || 0} documentos emitidos
              </div>
            </div>

            {/* Variación */}
            <div className={`border p-4 rounded-xl flex flex-col justify-between ${
              reportData.comparison.diffPercent >= 0 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-slate-300">
                  Crecimiento / Variación
                </span>
                <div className={`text-2xl font-black font-mono flex items-center gap-1 ${
                  reportData.comparison.diffPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {reportData.comparison.diffPercent >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  {reportData.comparison.diffPercent > 0 ? `+${reportData.comparison.diffPercent}%` : `${reportData.comparison.diffPercent}%`}
                </div>
              </div>
              <p className="text-xs font-mono text-slate-300 mt-2">
                Diferencia: {reportData.comparison.diffUsd >= 0 ? `+$${reportData.comparison.diffUsd.toFixed(2)}` : `-$${Math.abs(reportData.comparison.diffUsd).toFixed(2)}`} USD Oficial
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown per client table in this range */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Detalle por Cliente en el Período ({sortedClientBreakdown.length} de {reportData?.clientBreakdown?.length || 0})
            </h3>
            <p className="text-xs text-slate-400">
              Rango: {startDate} al {endDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buscador de tabla */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filtrar por cliente..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-orange-500 w-44 sm:w-52"
              />
            </div>

            {/* Selector de ordenamiento */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                Ordenar:
              </span>
              <select
                value={tableSort}
                onChange={(e: any) => setTableSort(e.target.value)}
                className="bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400"
              >
                <option value="fee_desc">💰 Mayor Tarifa Primero ($$$ ➔ $)</option>
                <option value="fee_asc">Tarifa Menor Primero ($ ➔ $$$)</option>
                <option value="invoiced_desc">Mayor Facturado ($ BCV)</option>
                <option value="invoiced_asc">Menor Facturado ($ BCV)</option>
                <option value="docs_desc">Más Facturas / Recibos</option>
                <option value="name_asc">Nombre Alfabético (A ➔ Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800 select-none">
              <tr>
                <th 
                  onClick={() => setTableSort(tableSort === 'name_asc' ? 'fee_desc' : 'name_asc')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <span className="inline-flex items-center gap-1">
                    Cliente {tableSort === 'name_asc' ? '▲' : ''}
                  </span>
                </th>
                <th 
                  onClick={() => setTableSort(tableSort === 'fee_desc' ? 'fee_asc' : 'fee_desc')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-emerald-400 transition"
                >
                  <span className="inline-flex items-center gap-1 justify-center">
                    Tarifa Actual {tableSort === 'fee_desc' ? '▼' : tableSort === 'fee_asc' ? '▲' : ''}
                  </span>
                </th>
                <th 
                  onClick={() => setTableSort(tableSort === 'docs_desc' ? 'fee_desc' : 'docs_desc')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-white transition"
                >
                  <span className="inline-flex items-center gap-1 justify-center">
                    Facturas/Recibos {tableSort === 'docs_desc' ? '▼' : ''}
                  </span>
                </th>
                <th className="py-3 px-4 text-right">Total Bs Liquidado</th>
                <th className="py-3 px-4 text-right">Base Oficial BCV (Bs)</th>
                <th 
                  onClick={() => setTableSort(tableSort === 'invoiced_desc' ? 'invoiced_asc' : 'invoiced_desc')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-amber-400 transition"
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Base Oficial ($ BCV) {tableSort === 'invoiced_desc' ? '▼' : tableSort === 'invoiced_asc' ? '▲' : ''}
                  </span>
                </th>
                <th className="py-3 px-4 text-center">Último Ajuste Tarifa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Cargando reporte...</td>
                </tr>
              ) : sortedClientBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron clientes con el filtro aplicado.
                  </td>
                </tr>
              ) : sortedClientBreakdown.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-850/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{c.name}</span>
                      {c.id === 'los-rosales' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                          🤝 $100 Isa / $100 Agencia
                        </span>
                      )}
                      {c.id === 'odontologo-rony' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                          🤝 Acuerdo $250 ($100 Isa BCV / $150 Agencia)
                        </span>
                      )}
                      {c.id === 'arinita' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                          📦 Intercambio: $85 Mercancía c/u (Sin pago a Isa)
                        </span>
                      )}
                      {(c.is_withholding_agent === 1 || c.id === 'mantica' || c.id === 'cc-garcia') && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-medium">
                          🏛️ Retención SENIAT (75% IVA / 2% ISLR)
                        </span>
                      )}
                      {(c.default_rate_type === 'PAYPAL' || c.id === 'calibre') && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">
                          💳 PayPal
                        </span>
                      )}
                    </div>
                    {c.business_name && c.business_name !== c.name && (
                      <div className="text-[10px] text-slate-500">{c.business_name}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                    ${c.base_monthly_fee}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {c.doc_count || 0}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    Bs. {formatBs(c.total_bs_applied)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    Bs. {formatBs(c.total_base_bs_bcv)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400">
                    ${(c.total_base_usd_bcv || 0).toFixed(2)} USD
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {c.last_fee_adjustment ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <History className="w-3 h-3 text-orange-400" />
                        {c.last_fee_adjustment}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Sin cambios</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
