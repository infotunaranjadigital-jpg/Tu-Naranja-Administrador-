'use client';

import React from 'react';
import { 
  Calendar, AlertCircle, CheckCircle, Clock, 
  ArrowUpRight, DollarSign, Users, FileText, ChevronRight 
} from 'lucide-react';

interface DashboardViewProps {
  clients: any[];
  documents: any[];
  rates: any;
  onEmitForClient: (client: any) => void;
  onViewDocument: (doc: any) => void;
  onTabChange: (tab: string) => void;
}

export default function DashboardView({
  clients,
  documents,
  rates,
  onEmitForClient,
  onViewDocument,
  onTabChange
}: DashboardViewProps) {
  const currentDay = new Date().getDate();
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Clientes que les toca facturar este mes
  const clientsUpcoming = [...clients].sort((a, b) => a.billing_day - b.billing_day);

  // Calcular totales en Unidad Base BCV
  const monthlyDocs = documents.filter(d => (d.issue_date || '').startsWith(currentMonthStr));
  const totalBaseUsd = monthlyDocs.reduce((acc, d) => acc + (d.base_usd_bcv || 0), 0);
  const totalBaseBs = monthlyDocs.reduce((acc, d) => acc + (d.base_bs_bcv || 0), 0);

  const paidDocs = monthlyDocs.filter(d => d.payment_status === 'PAID');
  const paidBaseUsd = paidDocs.reduce((acc, d) => acc + (d.base_usd_bcv || 0), 0);

  const pendingDocs = documents.filter(d => d.payment_status === 'PENDING');
  const pendingBaseUsd = pendingDocs.reduce((acc, d) => acc + (d.base_usd_bcv || 0), 0);

  const formatBs = (n: number) => (n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Hero Financial KPI Cards in UNIDAD BASE BCV */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Facturado Mes (Base BCV) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Facturado / Emitido (Mes)</span>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">Base Oficial</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalBaseUsd.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">USD BCV</span>
          </div>
          <p className="text-xs text-orange-400 font-mono mt-1">
            Bs. {formatBs(totalBaseBs)}
          </p>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
            {monthlyDocs.length} documentos emitidos este mes
          </div>
        </div>

        {/* Total Cobrado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Cobrado Efectivo / Pagado</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${paidBaseUsd.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">USD</span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {paidDocs.length} facturas/recibos liquidados
          </p>
          <div className="text-[11px] text-emerald-500/80 mt-3 pt-2 border-t border-slate-800">
            Tasa efectiva promedio registrada
          </div>
        </div>

        {/* Pendiente por Cobrar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Cuentas por Cobrar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ${pendingBaseUsd.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">USD</span>
          </div>
          <p className="text-xs text-amber-300 font-mono mt-1">
            {pendingDocs.length} pagos pendientes
          </p>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800">
            Alertas de cobro por enviar
          </div>
        </div>

        {/* Tasa BCV Oficial */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Referencia Oficial BCV</span>
            <span className="text-xs">🇻🇪</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {rates?.bcv_usd?.toLocaleString('es-VE', { minimumFractionDigits: 2 })} <span className="text-xs font-sans text-slate-400 font-normal">Bs/$</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
            <span>Binance P2P:</span>
            <span className="font-mono font-bold text-amber-300">{rates?.binance_usdt} Bs</span>
          </div>
          <div className="text-[11px] text-yellow-300/80 mt-3 pt-2 border-t border-slate-800">
            Promedio: {rates?.average_usd} Bs/$
          </div>
        </div>
      </div>

      {/* Main Grid: Calendario de Cobros Mensuales + Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calendario de Emisiones y Cobros del Mes */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-slate-100 text-base">
                Programación de Cobro Mensual (Clientes Activos)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Hoy es día <strong className="text-orange-400 font-mono">{currentDay}</strong> del mes
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {clientsUpcoming.map((c) => {
              const isToday = c.billing_day === currentDay;
              const isPast = c.billing_day < currentDay;
              const isNear = c.billing_day > currentDay && c.billing_day <= currentDay + 5;

              return (
                <div key={c.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-850 transition px-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    {/* Badge de día */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${
                      isToday 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse' 
                        : isNear 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                          : 'bg-slate-800 text-slate-300'
                    }`}>
                      <span className="text-[9px] uppercase tracking-wider font-normal">Día</span>
                      <span className="font-mono text-sm leading-none">{c.billing_day}</span>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                        {c.name}
                        {c.preferred_document === 'FORMA_LIBRE' ? (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-mono">
                            Forma Libre
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                            Recibo Digital
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Fee: <strong className="text-slate-200">${c.base_monthly_fee}</strong></span>
                        <span>• Tasa habitual: <strong className="text-amber-400">{c.default_rate_type}</strong></span>
                        {c.meta_ads_budget > 0 && (
                          <span>• Ads: <strong className="text-cyan-400">${c.meta_ads_budget}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEmitForClient(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600/90 hover:bg-orange-500 text-white flex items-center gap-1 transition shadow"
                    >
                      Emitir
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Últimos Documentos Emitidos & Alertas */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cuentas por cobrar urgentes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Pagos Pendientes por Confirmar
            </h4>

            {pendingDocs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">¡Al día! No hay cobros pendientes.</p>
            ) : (
              <div className="space-y-2.5">
                {pendingDocs.slice(0, 5).map((d) => (
                  <div 
                    key={d.id} 
                    onClick={() => onViewDocument(d)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{d.client_name}</span>
                      <span className="font-mono font-bold text-amber-400">
                        ${d.total_amount_currency} USD
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{d.doc_type === 'FORMA_LIBRE' ? `Factura #${d.doc_number}` : `Recibo #${d.doc_number}`}</span>
                      <span>{d.issue_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acceso Rápido a Emitir */}
          <div className="bg-gradient-to-br from-orange-600 to-amber-700 rounded-2xl p-5 text-white shadow-xl">
            <h4 className="font-black text-base mb-1">Nueva Emisión</h4>
            <p className="text-xs text-orange-100 mb-4 leading-relaxed">
              Genera una factura en forma libre para imprimir en tu talonario o un recibo digital en PDF.
            </p>
            <button
              onClick={() => onTabChange('new-emission')}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-orange-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              Comenzar Emisión
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
