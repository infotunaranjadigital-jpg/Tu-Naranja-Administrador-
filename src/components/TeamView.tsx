'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, DollarSign, CheckCircle2, 
  Calendar, ArrowRight, UserCheck, Clock, X, Edit3, Trash2, RefreshCw, AlertCircle, Sparkles
} from 'lucide-react';

export default function TeamView() {
  const [members, setMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal registrar pago
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentPeriod, setPaymentPeriod] = useState('Octubre 2da Quincena');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAGO_MOVIL');
  const [rateTypeApplied, setRateTypeApplied] = useState('BCV');
  const [rateApplied, setRateApplied] = useState<number>(0);
  const [amountBs, setAmountBs] = useState<number>(0);
  const [reference, setReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  // Modal editar colaborador
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editSalary, setEditSalary] = useState('');
  const [editMethod, setEditMethod] = useState('PAGO_MOVIL');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      setRates(data.rates || null);
    } catch (e) {
      console.error('Error fetching rates', e);
    }
  };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setMembers(data.members || []);
      setRecentPayments(data.recentPayments || []);
    } catch {
      alert('Error al cargar equipo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchRates();
  }, []);

  // Abrir modal de pago y precalcular montos con tasas en vivo
  const handleOpenPayModal = (member: any) => {
    setSelectedMember(member);
    const quincenaAmount = (member.monthly_salary / 2);
    setPaymentAmount(quincenaAmount.toString());
    setPaymentMethod(member.payment_method || 'PAGO_MOVIL');
    setReference('');
    setPaymentNotes('');

    // Preseleccionar tasa según regla del colaborador
    const bcvUsd = rates?.bcv_usd || 866.56;
    const bcvEur = rates?.bcv_eur || 942.30;
    const binanceUsdt = rates?.binance_usdt || 920.00;

    if (member.id === 'tm_ysael') {
      // Ysael: default a Euro si todo bien, o BCV
      setRateTypeApplied('EURO');
      setRateApplied(bcvEur);
      setAmountBs(quincenaAmount * bcvEur);
    } else if (member.payment_method === 'BINANCE') {
      setRateTypeApplied('BINANCE');
      setRateApplied(binanceUsdt);
      setAmountBs(0); // se paga directo en USDT
    } else {
      setRateTypeApplied('BCV');
      setRateApplied(bcvUsd);
      setAmountBs(quincenaAmount * bcvUsd);
    }

    setPayModalOpen(true);
  };

  // Recalcular monto en Bs al cambiar la tasa o monto en el modal de pago
  const handleRateTypeChange = (type: string) => {
    setRateTypeApplied(type);
    const bcvUsd = rates?.bcv_usd || 866.56;
    const bcvEur = rates?.bcv_eur || 942.30;
    const binanceUsdt = rates?.binance_usdt || 920.00;
    const amt = parseFloat(paymentAmount) || 0;

    let selectedRate = bcvUsd;
    if (type === 'EURO') selectedRate = bcvEur;
    if (type === 'BINANCE') selectedRate = binanceUsdt;

    setRateApplied(selectedRate);
    if (paymentMethod === 'BINANCE' || type === 'BINANCE') {
      setAmountBs(0);
    } else {
      setAmountBs(amt * selectedRate);
    }
  };

  const handleAmountChange = (val: string) => {
    setPaymentAmount(val);
    const amt = parseFloat(val) || 0;
    if (paymentMethod === 'BINANCE' || rateTypeApplied === 'BINANCE') {
      setAmountBs(0);
    } else {
      setAmountBs(amt * rateApplied);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSavingPay(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAYMENT',
          member_id: selectedMember.id,
          date: new Date().toISOString().split('T')[0],
          period: paymentPeriod,
          amount: parseFloat(paymentAmount) || 0,
          currency: 'USD',
          rate_type: rateTypeApplied,
          rate_applied: rateApplied,
          amount_bs: amountBs,
          payment_method: paymentMethod,
          reference: reference,
          notes: paymentNotes
        })
      });

      if (res.ok) {
        fetchTeam();
        setPayModalOpen(false);
      } else {
        alert('Error al registrar pago');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSavingPay(false);
    }
  };

  const handleOpenEditModal = (member: any) => {
    setEditingMember(member);
    setEditSalary(member.monthly_salary?.toString() || '0');
    setEditMethod(member.payment_method || 'PAGO_MOVIL');
    setEditNotes(member.notes || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_MEMBER',
          id: editingMember.id,
          monthly_salary: parseFloat(editSalary) || 0,
          payment_method: editMethod,
          notes: editNotes
        })
      });

      if (res.ok) {
        fetchTeam();
        setEditModalOpen(false);
      } else {
        alert('Error al actualizar colaborador');
      }
    } catch {
      alert('Error de red');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResetCanonical = async () => {
    if (!confirm('¿Deseas restablecer el equipo exacto oficial (Ysael, Angie, Adis, Mariana, Eleonora)?')) return;
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_CANONICAL' })
      });
      if (res.ok) {
        fetchTeam();
      }
    } catch {
      alert('Error al restablecer equipo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-400" />
            Recursos Humanos & Nómina del Equipo ({members.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de asignaciones mensuales, incentivos pactados (Tasa Euro / Tasa BCV / Binance) y pagos quincenales.
          </p>
        </div>
        <button
          onClick={handleResetCanonical}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
          title="Sincronizar y limpiar duplicados"
        >
          <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
          Sincronizar Nómina
        </button>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const isYsael = member.id === 'tm_ysael' || member.name.toLowerCase().includes('ysael');
          const isAngie = member.id === 'tm_angie' || member.name.toLowerCase().includes('angie');
          const isEleonora = member.id === 'tm_eleonora' || member.name.toLowerCase().includes('eleonora');

          return (
            <div 
              key={member.id} 
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition relative overflow-hidden ${
                isYsael 
                  ? 'border-indigo-500/40 hover:border-indigo-400/60' 
                  : isEleonora 
                  ? 'border-amber-500/40 hover:border-amber-400/60' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-100 text-sm">{member.name}</h3>
                      <button 
                        onClick={() => handleOpenEditModal(member)}
                        className="text-slate-500 hover:text-slate-300 transition p-0.5"
                        title="Editar asignación o notas"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>

                  {/* Insignia de Forma de Pago */}
                  {member.payment_method === 'BINANCE' ? (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      🟡 Binance USDT
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                      📲 Pago Móvil
                    </span>
                  )}
                </div>

                {/* Insignia de Regla / Incentivo */}
                <div className="mb-3">
                  {isYsael ? (
                    <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-lg px-2.5 py-1.5 text-[11px] text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span><strong>Incentivo Euro (€):</strong> si cumple objetivos; sino tasa BCV regular.</span>
                    </div>
                  ) : isAngie ? (
                    <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>$240 a Tasa BCV:</strong> (Base $200 + bono incentivo $40).</span>
                    </div>
                  ) : isEleonora ? (
                    <div className="bg-amber-950/60 border border-amber-800/60 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>$60 Tasa Binance:</strong> Pago directo por Binance Pay USDT.</span>
                    </div>
                  ) : (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>${member.monthly_salary} a Tasa BCV Oficial:</strong> Pago regular en Bs.</span>
                    </div>
                  )}
                </div>

                {/* Salary & Frequency */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 my-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Asignación Mensual</span>
                    <span className="font-bold font-mono text-emerald-400 text-base">
                      ${member.monthly_salary} <span className="text-[10px] font-normal text-slate-400">USD</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Quincena Base</span>
                    <span className="font-bold font-mono text-slate-200 text-base">
                      ${(member.monthly_salary / 2).toFixed(0)} <span className="text-[10px] font-normal text-slate-400">USD</span>
                    </span>
                  </div>
                </div>

                {/* Notas / Datos de Pago */}
                {member.notes && (
                  <p className="text-[11px] text-slate-400 italic mb-3 line-clamp-2">
                    {member.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleOpenPayModal(member)}
                className="w-full mt-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow shadow-orange-600/30"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Pagar Quincena (${(member.monthly_salary / 2).toFixed(0)})
              </button>
            </div>
          );
        })}
      </div>

      {/* Historial de Pagos Recientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Historial de Pagos Registrados
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {recentPayments.length} comprobantes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4 text-right">Monto ($)</th>
                <th className="py-3 px-4 text-center">Tasa Aplicada</th>
                <th className="py-3 px-4 text-right">Liquidación</th>
                <th className="py-3 px-4 text-center">Método</th>
                <th className="py-3 px-4">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Aún no se han registrado pagos en el sistema.
                  </td>
                </tr>
              ) : recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-850/60 transition">
                  <td className="py-3 px-4 font-mono text-slate-400">{p.date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{p.member_name}</td>
                  <td className="py-3 px-4 text-slate-300">{p.period}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ${p.amount?.toFixed(2)} USD
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-300">
                    {p.rate_applied ? `${p.rate_type} (${p.rate_applied.toFixed(2)})` : p.rate_type || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-amber-300">
                    {p.amount_bs ? `Bs. ${p.amount_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : `${p.amount?.toFixed(2)} USDT`}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-amber-300">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{p.reference || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Pago */}
      {payModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setPayModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-400" />
              Pagar Quincena: {selectedMember.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Asignación: <strong className="text-emerald-400">${selectedMember.monthly_salary} USD/mes</strong>
            </p>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Período de Nómina</label>
                <input
                  type="text"
                  required
                  value={paymentPeriod}
                  onChange={(e) => setPaymentPeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                  placeholder="Ej. Octubre 2da Quincena"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Monto en Dólares ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-orange-500"
                />
              </div>

              {/* Selector de Tasa con Incentivo para Ysael y opciones generales */}
              {selectedMember.payment_method !== 'BINANCE' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tasa de Cambio a Aplicar</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRateTypeChange('BCV')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        rateTypeApplied === 'BCV'
                          ? 'bg-blue-900/30 border-blue-500 text-blue-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block font-bold text-[11px]">Tasa Dólar BCV</span>
                      <span className="font-mono text-xs">{rates?.bcv_usd?.toFixed(2) || '866.56'} Bs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRateTypeChange('EURO')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        rateTypeApplied === 'EURO'
                          ? 'bg-indigo-900/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block font-bold text-[11px] flex items-center gap-1">
                        💶 Tasa Euro BCV
                        {selectedMember.id === 'tm_ysael' && <span className="text-[9px] text-amber-400 font-semibold">(Incentivo)</span>}
                      </span>
                      <span className="font-mono text-xs">{rates?.bcv_eur?.toFixed(2) || '942.30'} Bs</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Caja de Conversión en Bolívares */}
              {selectedMember.payment_method !== 'BINANCE' && rateTypeApplied !== 'BINANCE' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total a transferir en Bolívares:</span>
                  <span className="text-sm font-mono font-bold text-amber-300">
                    Bs. {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {selectedMember.payment_method === 'BINANCE' && (
                <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-amber-300">Total a transferir en Binance:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {parseFloat(paymentAmount) || 0} USDT
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-semibold text-amber-300"
                >
                  <option value="PAGO_MOVIL">📲 Pago Móvil Mercantil</option>
                  <option value="TRANSFERENCIA_BS">🏦 Transferencia Bancaria Bs</option>
                  <option value="BINANCE">🟡 Binance Pay / USDT</option>
                  <option value="EFECTIVO_USD">💵 Efectivo ($ USD)</option>
                  <option value="ZELLE">🇺🇸 Zelle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">N.º Referencia / Comprobante / TxID</label>
                <input
                  type="text"
                  placeholder="Ej. 19283749 o Binance Pay ID"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPay}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30"
                >
                  {savingPay ? 'Registrando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Colaborador */}
      {editModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1">Editar Colaborador: {editingMember.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{editingMember.role}</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Asignación Mensual ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Método de Pago Acordado</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                >
                  <option value="PAGO_MOVIL">📲 Pago Móvil</option>
                  <option value="BINANCE">🟡 Binance USDT</option>
                  <option value="TRANSFERENCIA_BS">🏦 Transferencia Bancaria Bs</option>
                  <option value="EFECTIVO_USD">💵 Efectivo ($ USD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas / Regla de Pago</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  placeholder="Condiciones de pago, cuenta bancaria o ID de Binance"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-1/2 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-1/2 py-2 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white"
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
