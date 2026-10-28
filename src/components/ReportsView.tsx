'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Calendar, DollarSign, 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ShieldCheck, History, Award, AlertCircle, RefreshCw
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

      {/* Visual Bar Chart: Facturación Mes a Mes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              📊 Gráfico Comparativo de Facturación Mensual (USD BCV)
            </h3>
            <p className="text-xs text-slate-400">
              Visualiza en qué mes se facturó más (verde) y en qué mes se facturó menos (ámbar).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-300">Mes Máximo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              <span className="text-slate-300">Mes Mínimo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-600 inline-block" />
              <span className="text-slate-300">Mes Regular</span>
            </div>
          </div>
        </div>

        {monthlySeries.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No hay documentos registrados en el rango de fechas seleccionado.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800 overflow-x-auto">
              {monthlySeries.map((m: any) => {
                const val = m.total_base_usd_bcv || 0;
                const heightPercent = Math.max(Math.round((val / maxSeriesVal) * 100), 8);
                const isPeak = m.month === reportData?.stats?.peakMonth;
                const isLowest = m.month === reportData?.stats?.lowestMonth;

                return (
                  <div key={m.month} className="flex-1 min-w-[65px] flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="text-[11px] font-mono font-bold text-slate-200 mb-1 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition">
                      ${val.toFixed(0)}
                    </div>

                    {/* Bar */}
                    <div 
                      className="w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative group-hover:brightness-110"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: isPeak ? '#10b981' : (isLowest ? '#f59e0b' : '#ea580c')
                      }}
                    >
                      {isPeak && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-emerald-400 text-xs">
                          👑
                        </div>
                      )}
                    </div>

                    {/* Month Label */}
                    <div className="text-[11px] font-semibold text-slate-400 mt-1 whitespace-nowrap">
                      {getMonthName(m.month)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            Detalle por Cliente en el Período Seleccionado
          </h3>
          <span className="text-xs text-slate-400">
            {startDate} al {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-center">Tarifa Actual</th>
                <th className="py-3 px-4 text-center">Facturas/Recibos</th>
                <th className="py-3 px-4 text-right">Total Bs Liquidado</th>
                <th className="py-3 px-4 text-right">Base Oficial BCV (Bs)</th>
                <th className="py-3 px-4 text-right">Base Oficial ($ BCV)</th>
                <th className="py-3 px-4 text-center">Último Ajuste Tarifa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Cargando reporte...</td>
                </tr>
              ) : reportData?.clientBreakdown?.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-850/60 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    <div>{c.name}</div>
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
