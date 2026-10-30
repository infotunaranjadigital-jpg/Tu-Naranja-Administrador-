'use client';

import React, { useState } from 'react';
import { 
  X, AlertCircle, CheckCircle, Clock, DollarSign, 
  Handshake, MessageCircle, ArrowUpRight, Users, 
  CreditCard, Calendar, ShieldCheck, ChevronRight
} from 'lucide-react';

interface AccountsReceivablePayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: any[];
  clients: any[];
  bcvRate: number;
  onOpenPayModal: (doc: any) => void;
}

export default function AccountsReceivablePayableModal({
  isOpen,
  onClose,
  documents,
  clients,
  bcvRate,
  onOpenPayModal
}: AccountsReceivablePayableModalProps) {
  const [activeTab, setActiveTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');

  if (!isOpen) return null;

  const pendingDocs = documents.filter(d => d.payment_status === 'PENDING');
  const totalPendingUsd = pendingDocs.reduce((acc, d) => acc + (d.total_amount_currency || 0), 0);
  const totalPendingBs = pendingDocs.reduce((acc, d) => acc + (d.total_bs_applied || (d.total_amount_currency * bcvRate) || 0), 0);

  const formatBs = (n: number) => (n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Cuentas por Pagar Estimadas
  // 1. Isabelle Acuerdos Compartidos: $100 Los Rosales (efectivo) + $100 Odontólogo Rony (BCV)
  const isaShareRosalesUsd = 100;
  const isaShareRonyUsd = 100;
  const isaShareRonyBs = Number((isaShareRonyUsd * bcvRate).toFixed(2));
  const totalIsaDueUsd = isaShareRosalesUsd + isaShareRonyUsd;

  // 2. Nómina de Equipo
  const payrollItems = [
    { name: 'Adisney Gutierrez', role: 'Diseñadora Gráfica', feeUsd: 120, rateRule: 'BCV' },
    { name: 'Marianna Sojo', role: 'Diseñadora Gráfica', feeUsd: 120, rateRule: 'BCV' },
    { name: 'Angie Barreto', role: 'Community Manager & Copy', feeUsd: 100, rateRule: 'BCV' },
    { name: 'Isabelle (Base)', role: 'Community & Estrategia', feeUsd: 100, rateRule: 'BCV' },
    { name: 'Eleonora Rivas', role: 'Atención & CM', feeUsd: 60, rateRule: 'Binance USDT' }
  ];
  const totalPayrollUsd = payrollItems.reduce((acc, it) => acc + it.feeUsd, 0);

  const totalPayableUsd = totalIsaDueUsd + totalPayrollUsd;

  const handleSendReminder = (doc: any) => {
    const client = clients.find(c => c.id === doc.client_id) || {};
    const phoneClean = (client.phone || doc.client_phone || '').replace(/[^0-9]/g, '');
    const msg = `Hola ${doc.client_name}, te saludamos de Tu Naranja Digital. Te recordamos cordialmente que el pago de la ${doc.doc_type === 'FORMA_LIBRE' ? 'Factura Fiscal' : 'mensualidad'} #${doc.doc_number} por $${doc.total_amount_currency} USD (Bs. ${formatBs(doc.total_bs_applied || doc.total_amount_currency * bcvRate)}) se encuentra pendiente.\n\nBanco Mercantil - Cta Corriente: 0105-0638-70-163832743-2\n¡Muchas gracias!`;

    navigator.clipboard.writeText(msg);
    if (phoneClean) {
      window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert('Mensaje copiado al portapapeles. (El cliente no tiene teléfono registrado)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-100 text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-400" />
              Control de Cuentas por Cobrar & Cuentas por Pagar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasa oficial de referencia: <strong className="text-orange-400 font-mono">{formatBs(bcvRate)} Bs/$</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950/60 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('RECEIVABLE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'RECEIVABLE'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cuentas por Cobrar ({pendingDocs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('PAYABLE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PAYABLE'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Cuentas por Pagar / Compromisos</span>
            </button>
          </div>

          <div className="text-xs font-mono">
            {activeTab === 'RECEIVABLE' ? (
              <span className="text-amber-400 font-bold">Total por Cobrar: ${totalPendingUsd.toFixed(2)} USD</span>
            ) : (
              <span className="text-orange-400 font-bold">Total Compromisos: ${totalPayableUsd.toFixed(2)} USD</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: CUENTAS POR COBRAR */}
          {activeTab === 'RECEIVABLE' && (
            <div className="space-y-4">
              {/* Resumen KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Total por Cobrar (USD)</div>
                  <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                    ${totalPendingUsd.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {pendingDocs.length} documentos con cobro pendiente
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Equivalente Oficial (Bs)</div>
                  <div className="text-2xl font-black text-slate-200 font-mono mt-1">
                    Bs. {formatBs(totalPendingBs)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Calculado a tasa BCV oficial
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado de Cartera</div>
                  <div className="text-xl font-bold text-slate-200 mt-1">
                    {pendingDocs.length === 0 ? '✨ 100% al Día' : '⚠️ Pendientes de Cobro'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Acción recomendada: Enviar recordatorios
                  </div>
                </div>
              </div>

              {/* Lista Detallada de Deudas */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Facturas y Recibos Pendientes de Liquidación
                  </h4>
                  <span className="text-xs text-slate-400">{pendingDocs.length} pendiente(s)</span>
                </div>

                {pendingDocs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    ¡Excelente! No hay cuentas por cobrar pendientes. Todos los clientes están solventes.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {pendingDocs.map((d) => (
                      <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">{d.client_name}</span>
                            <span className="text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-lg">
                              {d.doc_type === 'FORMA_LIBRE' ? `Factura #${d.doc_number}` : `Recibo #${d.doc_number}`}
                            </span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                              ⏳ Pendiente
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                            <span>Emisión: <strong className="text-slate-300 font-mono">{d.issue_date}</strong></span>
                            <span>•</span>
                            <span>Tasa: <strong className="text-amber-400">{d.rate_type_applied}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <div className="font-mono font-black text-amber-400 text-base leading-none">
                              ${d.total_amount_currency} <span className="text-[10px] font-sans font-normal text-slate-400">USD</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Bs. {formatBs(d.total_bs_applied || d.total_amount_currency * bcvRate)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSendReminder(d)}
                              className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                            <button
                              onClick={() => onOpenPayModal(d)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-600/20"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Registrar Cobro</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CUENTAS POR PAGAR (COMPROMISOS) */}
          {activeTab === 'PAYABLE' && (
            <div className="space-y-4">
              {/* Sección Isabelle */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-slate-100 text-sm">
                      Pagos Compartidos a Isabelle (Convenios de Clientes)
                    </h4>
                  </div>
                  <span className="font-mono font-black text-amber-300 text-base">
                    ${totalIsaDueUsd} USD
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Autopartes Los Rosales</div>
                      <div className="text-[11px] text-slate-400">Modalidad: $100 efectivo directo a Isabelle</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-400">$100.00 USD</div>
                      <div className="text-[10px] text-slate-500">En Efectivo</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Odontólogo (Dr. Rony)</div>
                      <div className="text-[11px] text-slate-400">Modalidad: $100 a tasa oficial BCV del día</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-400">$100.00 USD</div>
                      <div className="text-[10px] text-amber-400">Bs. {formatBs(isaShareRonyBs)}</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between opacity-80">
                    <div>
                      <div className="font-semibold text-slate-200">Arinita (Intercambio en Mercancía)</div>
                      <div className="text-[11px] text-slate-400">Modalidad: $85 en mercancía directa a Isa (Sin dinero)</div>
                    </div>
                    <div className="text-right font-mono text-purple-300">
                      <div className="font-bold">$85.00 Mercancía</div>
                      <div className="text-[10px] text-slate-500">Sin desembolso</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Nómina de Equipo */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-400" />
                    <h4 className="font-bold text-slate-100 text-sm">
                      Nómina Mensual de Colaboradoras
                    </h4>
                  </div>
                  <span className="font-mono font-black text-orange-400 text-base">
                    ${totalPayrollUsd} USD
                  </span>
                </div>

                <div className="divide-y divide-slate-900">
                  {payrollItems.map((p, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <span className="text-[11px] text-slate-400 block">{p.role} • Regla: {p.rateRule}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-100">${p.feeUsd} USD</span>
                        <span className="text-[10px] text-slate-500 block">
                          Bs. {formatBs(p.feeUsd * bcvRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
