'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, DollarSign, CheckCircle2, 
  Calendar, ArrowRight, UserCheck, Clock, X 
} from 'lucide-react';

export default function TeamView() {
  const [members, setMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal registrar pago a colaborador
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentPeriod, setPaymentPeriod] = useState('Octubre 2da Quincena');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BINANCE');
  const [reference, setReference] = useState('');
  const [savingPay, setSavingPay] = useState(false);

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
  }, []);

  const handleOpenPayModal = (member: any) => {
    setSelectedMember(member);
    setPaymentAmount((member.monthly_salary / 2).toString()); // quincena
    setPaymentMethod(member.payment_method || 'PAGO_MOVIL');
    setReference('');
    setPayModalOpen(true);
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
          payment_method: paymentMethod,
          reference: reference
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-400" />
            Recursos Humanos & Pagos de Nómina ({members.length})
          </h2>
          <p className="text-xs text-slate-400">
            Control de colaboradores, método de pago pactado (Binance, Pago Móvil) e historial de pagos.
          </p>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{member.name}</h3>
                  <p className="text-xs text-slate-400">{member.role}</p>
                </div>
                {member.payment_method === 'BINANCE' ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    🟡 Solo Binance
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-bold">
                    📲 Pago Móvil
                  </span>
                )}
              </div>

              {/* Salary & Frequency */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 my-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Asignación Mensual</span>
                  <span className="font-bold font-mono text-emerald-400 text-base">
                    ${member.monthly_salary} <span className="text-[10px] font-normal text-slate-400">USD</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Frecuencia</span>
                  <span className="font-bold text-slate-300 text-xs">
                    {member.payment_frequency}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenPayModal(member)}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow shadow-orange-600/30"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Pagar Quincena
            </button>
          </div>
        ))}
      </div>

      {/* Historial de Pagos Recientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Historial de Pagos al Equipo
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Método de Pago</th>
                <th className="py-3 px-4">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setPayModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1">Registrar Pago: {selectedMember.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Método pactado: <strong className="text-amber-400">{selectedMember.payment_method}</strong>
            </p>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Período de Pago</label>
                <input
                  type="text"
                  required
                  value={paymentPeriod}
                  onChange={(e) => setPaymentPeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  placeholder="Ej. Octubre 2da Quincena"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Monto a Pagar ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-semibold text-amber-300"
                >
                  <option value="BINANCE">Binance Pay / USDT</option>
                  <option value="PAGO_MOVIL">Pago Móvil Mercantil</option>
                  <option value="TRANSFERENCIA_BS">Transferencia Bancaria Bs</option>
                  <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                  <option value="ZELLE">Zelle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">N.º Comprobante / TxID</label>
                <input
                  type="text"
                  placeholder="Ej. 129849204 o ID Binance"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="w-1/2 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPay}
                  className="w-1/2 py-2 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30"
                >
                  {savingPay ? 'Registrando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
