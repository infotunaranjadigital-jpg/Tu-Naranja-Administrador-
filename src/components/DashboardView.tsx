'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, AlertCircle, CheckCircle, Clock, 
  ArrowUpRight, DollarSign, Users, FileText, ChevronRight,
  LayoutGrid, List, Search, Sparkles, Flame, ShieldAlert,
  Handshake, Package, CreditCard, Building2
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default en 'cuadrados' como pidió el usuario
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'NEXT_7_DAYS' | 'FORMA_LIBRE' | 'RECIBO'>('ALL');

  const now = new Date();
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based
  const currentMonthStr = now.toISOString().slice(0, 7);
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  // Cálculo de proximidad cronológica a vencer
  const sortedClients = useMemo(() => {
    const list = clients.map((c) => {
      const bDay = Number(c.billing_day) || 1;
      let daysRemaining = 0;
      let nextMonthIdx = currentMonth;
      let nextYear = currentYear;

      if (bDay === currentDay) {
        daysRemaining = 0;
      } else if (bDay > currentDay) {
        daysRemaining = bDay - currentDay;
      } else {
        daysRemaining = (daysInCurrentMonth - currentDay) + bDay;
        nextMonthIdx = (currentMonth + 1) % 12;
        if (currentMonth === 11) nextYear += 1;
      }

      const nextDateFormatted = `${bDay} ${monthNames[nextMonthIdx]}`;

      return {
        ...c,
        billing_day_num: bDay,
        daysRemaining,
        nextDateFormatted
      };
    });

    // Ordenar de MENOR a MAYOR días restantes (primero los que vencen hoy o en los próximos días)
    list.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return list;
  }, [clients, currentDay, currentMonth, currentYear, daysInCurrentMonth]);

  // Filtrado
  const filteredClients = useMemo(() => {
    return sortedClients.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesBusiness = (c.business_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBusiness) return false;
      }

      if (filterType === 'NEXT_7_DAYS' && c.daysRemaining > 7) return false;
      if (filterType === 'FORMA_LIBRE' && c.preferred_document !== 'FORMA_LIBRE') return false;
      if (filterType === 'RECIBO' && c.preferred_document === 'FORMA_LIBRE') return false;

      return true;
    });
  }, [sortedClients, searchQuery, filterType]);

  // Totales en Unidad Base BCV
  const monthlyDocs = documents.filter(d => (d.issue_date || '').startsWith(currentMonthStr));
  const totalBaseUsd = monthlyDocs.reduce((acc, d) => acc + (d.base_usd_bcv || 0), 0);
  const totalBaseBs = monthlyDocs.reduce((acc, d) => acc + (d.base_bs_bcv || 0), 0);

  const paidDocs = monthlyDocs.filter(d => d.payment_status === 'PAID');
  const paidBaseUsd = paidDocs.reduce((acc, d) => acc + (d.base_usd_bcv || 0), 0);

  const pendingDocs = documents.filter(d => d.payment_status === 'PENDING');
  const pendingBaseUsd = pendingDocs.reduce((acc, d) => acc + (d.base_usd_bcv || 0), 0);

  const formatBs = (n: number) => (n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bcvRate = Number(rates?.bcv_usd) || 888.12;

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
        {/* Left: Calendario de Emisiones y Cobros en Cuadrados (Cards Notion) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          {/* Header con Controles y Selector de Vista */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-400" />
                <h3 className="font-black text-slate-100 text-base">
                  Programación de Cobro Mensual
                </h3>
                <span className="text-[11px] bg-orange-500/20 text-orange-400 font-semibold px-2 py-0.5 rounded-full">
                  Próximos a Vencer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hoy es día <strong className="text-orange-400 font-mono">{currentDay}</strong> del mes • Ordenados cronológicamente por vencimiento
              </p>
            </div>

            {/* Toggle Cuadrados / Lista */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    viewMode === 'grid' 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista en Cuadrados (Cards Notion)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cuadrados</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    viewMode === 'list' 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista en Lista compacta"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros Rápidos y Buscador */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/60 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-850'
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                onClick={() => setFilterType('NEXT_7_DAYS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 ${
                  filterType === 'NEXT_7_DAYS'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-850'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                Próximos 7 días
              </button>
              <button
                onClick={() => setFilterType('FORMA_LIBRE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                  filterType === 'FORMA_LIBRE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-850'
                }`}
              >
                Forma Libre
              </button>
              <button
                onClick={() => setFilterType('RECIBO')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                  filterType === 'RECIBO'
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-850'
                }`}
              >
                Recibo
              </button>
            </div>
          </div>

          {/* VISTA EN CUADRADOS (NOTION STYLE CARDS) */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {filteredClients.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  No se encontraron clientes que coincidan con la búsqueda.
                </div>
              ) : (
                filteredClients.map((c) => {
                  const isToday = c.daysRemaining === 0;
                  const isUrgent = c.daysRemaining <= 3;
                  const isNear = c.daysRemaining <= 7;
                  const estimatedBs = Number((c.base_monthly_fee * bcvRate).toFixed(2));

                  return (
                    <div
                      key={c.id}
                      className={`group relative bg-slate-950/80 rounded-2xl p-4 border transition-all duration-200 hover:shadow-xl flex flex-col justify-between ${
                        isToday
                          ? 'border-rose-500/60 shadow-rose-950/20 hover:border-rose-400 ring-1 ring-rose-500/30'
                          : isUrgent
                            ? 'border-amber-500/50 shadow-amber-950/20 hover:border-amber-400'
                            : isNear
                              ? 'border-cyan-500/40 hover:border-cyan-400'
                              : 'border-slate-800 hover:border-orange-500/40'
                      }`}
                    >
                      {/* Top Bar: Proximidad + Documento */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          {isToday ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-lg animate-pulse">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              🚨 ¡VENCE HOY!
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                              <Flame className="w-3 h-3 text-amber-400" />
                              ⚡ Vence en {c.daysRemaining} {c.daysRemaining === 1 ? 'día' : 'días'} ({c.nextDateFormatted})
                            </span>
                          ) : isNear ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              En {c.daysRemaining} días ({c.nextDateFormatted})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              En {c.daysRemaining} días ({c.nextDateFormatted})
                            </span>
                          )}

                          {c.preferred_document === 'FORMA_LIBRE' ? (
                            <span className="text-[10px] font-bold font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-lg">
                              Forma Libre
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg">
                              Recibo
                            </span>
                          )}
                        </div>

                        {/* Nombre del Cliente */}
                        <div className="font-black text-slate-100 text-sm group-hover:text-orange-300 transition line-clamp-1">
                          {c.name}
                        </div>
                        {c.business_name && c.business_name !== c.name && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 mb-1">
                            {c.business_name}
                          </div>
                        )}

                        {/* Etiquetas de Acuerdos Especiales y Notas */}
                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                          {c.id === 'odontologo-rony' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                              <Handshake className="w-3 h-3 text-amber-400" />
                              $100 Isa BCV / $150 Agencia
                            </span>
                          )}
                          {c.id === 'arinita' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                              <Package className="w-3 h-3 text-amber-400" />
                              Intercambio: $85 Mercancía c/u
                            </span>
                          )}
                          {c.id === 'los-rosales' && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                              <Handshake className="w-3 h-3 text-amber-400" />
                              $100 Isa / $100 Agencia
                            </span>
                          )}
                          {(c.is_withholding_agent === 1 || c.id === 'mantica' || c.id === 'cc-garcia') && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-medium">
                              <Building2 className="w-3 h-3 text-indigo-400" />
                              Retención SENIAT (75%/2%)
                            </span>
                          )}
                          {(c.default_rate_type === 'PAYPAL' || c.id === 'calibre') && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">
                              <CreditCard className="w-3 h-3 text-blue-400" />
                              PayPal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tarifa & Acción de Emisión */}
                      <div className="pt-3 border-t border-slate-900 mt-1 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">
                            Tarifa Mensual • Tasa {c.default_rate_type}
                          </div>
                          <div className="text-lg font-black text-slate-100 font-mono leading-none mt-0.5">
                            ${c.base_monthly_fee}{' '}
                            <span className="text-[10px] font-sans font-normal text-slate-400">USD</span>
                          </div>
                          <div className="text-[10px] text-orange-400 font-mono mt-0.5">
                            Bs. {formatBs(estimatedBs)}
                          </div>
                        </div>

                        <button
                          onClick={() => onEmitForClient(c)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1 transition shadow-md shadow-orange-600/30 active:scale-95"
                        >
                          Emitir
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VISTA EN LISTA DETALLADA */
            <div className="divide-y divide-slate-800 pt-1">
              {filteredClients.map((c) => {
                const isToday = c.daysRemaining === 0;
                const isUrgent = c.daysRemaining <= 3;
                const isNear = c.daysRemaining <= 7;

                return (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-850/60 transition px-2.5 rounded-xl">
                    <div className="flex items-center gap-3">
                      {/* Badge de día y proximidad */}
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                        isToday 
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse' 
                          : isUrgent 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : isNear
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-300'
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider font-normal">Día</span>
                        <span className="font-mono text-sm leading-none">{c.billing_day_num}</span>
                      </div>

                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-2 text-sm flex-wrap">
                          <span>{c.name}</span>
                          {isToday && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold animate-pulse">
                              ¡Vence Hoy!
                            </span>
                          )}
                          {!isToday && isUrgent && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                              En {c.daysRemaining}d ({c.nextDateFormatted})
                            </span>
                          )}
                          {c.id === 'odontologo-rony' && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                              🤝 $100 Isa BCV / $150 Agencia
                            </span>
                          )}
                          {c.id === 'arinita' && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                              📦 $85 Mercancía c/u
                            </span>
                          )}
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

                    <button
                      onClick={() => onEmitForClient(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-600/90 hover:bg-orange-500 text-white flex items-center gap-1 transition shadow shrink-0"
                    >
                      Emitir
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
