'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Calendar, DollarSign, 
  TrendingUp, ShieldCheck, HelpCircle, History 
} from 'lucide-react';

export default function ReportsView() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?year=${year}`);
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
  }, [year]);

  const formatBs = (num: number) => (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    link.setAttribute('download', `reporte_facturacion_${year}_tu_naranja.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            Reportes Financieros & Unidad Base BCV
          </h2>
          <p className="text-xs text-slate-400">
            Métricas de facturación homogéneas sin distorsión por devaluación o brecha cambiaria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400 font-semibold">Año:</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-slate-950 font-bold text-slate-100 outline-none rounded px-2 py-1"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Exportar Excel / CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Anual en Unidad Base BCV
            </span>
            <div className="text-2xl font-black text-white font-mono">
              ${(reportData.totals?.total_base_usd_bcv || 0).toFixed(2)} <span className="text-xs font-sans text-slate-400">USD Oficial</span>
            </div>
            <p className="text-xs text-orange-400 font-mono mt-1">
              Bs. {formatBs(reportData.totals?.total_base_bs_bcv)}
            </p>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Calculado a la tasa oficial del día de cada cobro
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cobrado vs Pendiente ({year})
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${(reportData.totals?.collected_usd || 0).toFixed(2)} <span className="text-xs text-slate-400 font-sans">Cobrado</span>
            </div>
            <p className="text-xs text-amber-400 font-mono mt-1">
              ${(reportData.totals?.pending_usd || 0).toFixed(2)} USD Pendiente por cobrar
            </p>
            <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
              Total documentos emitidos: {reportData.totals?.total_documents || 0}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Facturado en Bolívares
            </span>
            <div className="text-2xl font-black text-slate-100 font-mono">
              Bs. {formatBs(reportData.totals?.total_bs_collected_or_applied)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monto global liquidado en moneda nacional
            </p>
            <div className="text-[11px] text-orange-400 mt-3 pt-2 border-t border-slate-800">
              Listo para reporte a contabilidad
            </div>
          </div>
        </div>
      )}

      {/* Breakdown per client table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            Detalle Anual de Facturación por Cliente ({year})
          </h3>
          <span className="text-xs text-slate-400">
            Incluye fecha del último ajuste de tarifa
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
