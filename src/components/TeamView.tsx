'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, DollarSign, CheckCircle2, 
  Calendar, ArrowRight, UserCheck, Clock, X, Edit3, Trash2, RefreshCw, AlertCircle, Sparkles,
  Palette, Layers, TrendingUp, TrendingDown, Award, AlertTriangle, FileText, Video,
  Image as ImageIcon, BookmarkCheck, User, Tag, ChevronRight, BarChart3, HelpCircle
} from 'lucide-react';

export default function TeamView() {
  const [activeTab, setActiveTab] = useState<'TEAM' | 'DESIGN_AUDIT' | 'PAYMENTS'>('TEAM');
  const [members, setMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [designerEvaluations, setDesignerEvaluations] = useState<any[]>([]);
  const [designerStats, setDesignerStats] = useState<any>(null);
  const [weeklySeries, setWeeklySeries] = useState<any[]>([]);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selector de gráfico en auditoría de diseño
  const [designChartType, setDesignChartType] = useState<'COMPARISON' | 'ERROR_RATE' | 'FORMATS'>('COMPARISON');
  const [selectedWeekDetail, setSelectedWeekDetail] = useState<any>(null);

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

  // Modal Ver/Editar Perfil & Habilidades
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const [memberSoftSkills, setMemberSoftSkills] = useState<string[]>([]);
  const [memberHardSkills, setMemberHardSkills] = useState<string[]>([]);
  const [newSoftInput, setNewSoftInput] = useState('');
  const [newHardInput, setNewHardInput] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  // Modal Registrar Evaluación del Lunes (Adis o Mariana)
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalDesignerId, setEvalDesignerId] = useState('tm_adis');
  const [evalDesignerName, setEvalDesignerName] = useState('Adis');
  const [evalWeekDate, setEvalWeekDate] = useState(new Date().toISOString().split('T')[0]);
  const [evalWeekLabel, setEvalWeekLabel] = useState('Semana 1 - Noviembre');
  const [evalClientsText, setEvalClientsText] = useState('Feminaid, SOVEMO, CC Garcia');
  const [evalStaticCount, setEvalStaticCount] = useState<number>(10);
  const [evalReelsCount, setEvalReelsCount] = useState<number>(3);
  const [evalCarouselsCount, setEvalCarouselsCount] = useState<number>(5);
  const [evalExtraCount, setEvalExtraCount] = useState<number>(1);
  const [evalReturnedCount, setEvalReturnedCount] = useState<number>(1);
  const [evalCorrectionReasons, setEvalCorrectionReasons] = useState('');
  const [evalFeedbackNotes, setEvalFeedbackNotes] = useState('');
  const [savingEval, setSavingEval] = useState(false);

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
      setDesignerEvaluations(data.designerEvaluations || []);
      setDesignerStats(data.designerStats || null);
      setWeeklySeries(data.weeklyComparisonSeries || []);
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

    const bcvUsd = rates?.bcv_usd || 888.12;
    const bcvEur = rates?.bcv_eur || 989.72;
    const binanceUsdt = rates?.binance_usdt || 1007.40;

    if (member.id === 'tm_isabelle') {
      setRateTypeApplied('EURO');
      setRateApplied(bcvEur);
      setAmountBs(quincenaAmount * bcvEur);
    } else if (member.payment_method === 'BINANCE') {
      setRateTypeApplied('BINANCE');
      setRateApplied(binanceUsdt);
      setAmountBs(0);
    } else {
      setRateTypeApplied('BCV');
      setRateApplied(bcvUsd);
      setAmountBs(quincenaAmount * bcvUsd);
    }

    setPayModalOpen(true);
  };

  const handleRateTypeChange = (type: string) => {
    setRateTypeApplied(type);
    const bcvUsd = rates?.bcv_usd || 888.12;
    const bcvEur = rates?.bcv_eur || 989.72;
    const binanceUsdt = rates?.binance_usdt || 1007.40;
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

  // Abrir Modal de Perfil & Habilidades
  const handleOpenProfileModal = (member: any) => {
    setViewingMember(member);
    try {
      setMemberSoftSkills(member.soft_skills ? JSON.parse(member.soft_skills) : []);
    } catch {
      setMemberSoftSkills([]);
    }
    try {
      setMemberHardSkills(member.hard_skills ? JSON.parse(member.hard_skills) : []);
    } catch {
      setMemberHardSkills([]);
    }
    setProfileModalOpen(true);
  };

  const handleAddSoftSkill = () => {
    if (!newSoftInput.trim()) return;
    setMemberSoftSkills([...memberSoftSkills, newSoftInput.trim()]);
    setNewSoftInput('');
  };

  const handleRemoveSoftSkill = (idx: number) => {
    setMemberSoftSkills(memberSoftSkills.filter((_, i) => i !== idx));
  };

  const handleAddHardSkill = () => {
    if (!newHardInput.trim()) return;
    setMemberHardSkills([...memberHardSkills, newHardInput.trim()]);
    setNewHardInput('');
  };

  const handleRemoveHardSkill = (idx: number) => {
    setMemberHardSkills(memberHardSkills.filter((_, i) => i !== idx));
  };

  const handleSaveSkills = async () => {
    if (!viewingMember) return;
    setSavingSkills(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_MEMBER_SKILLS',
          member_id: viewingMember.id,
          soft_skills: memberSoftSkills,
          hard_skills: memberHardSkills
        })
      });

      if (res.ok) {
        fetchTeam();
        alert('Habilidades actualizadas correctamente.');
      } else {
        alert('Error al guardar habilidades');
      }
    } catch {
      alert('Error de red');
    } finally {
      setSavingSkills(false);
    }
  };

  // Abrir Modal Registrar Evaluación Semanal (Lunes)
  const handleOpenEvalModal = (designerNamePref?: string) => {
    if (designerNamePref === 'Mariana') {
      setEvalDesignerId('tm_mariana');
      setEvalDesignerName('Mariana');
    } else {
      setEvalDesignerId('tm_adis');
      setEvalDesignerName('Adis');
    }
    setEvalModalOpen(true);
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEval(true);
    try {
      const clientsList = evalClientsText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_DESIGNER_EVALUATION',
          member_id: evalDesignerId,
          designer_name: evalDesignerName,
          week_start_date: evalWeekDate,
          week_label: evalWeekLabel,
          clients_worked: clientsList,
          static_posts_count: evalStaticCount,
          reels_count: evalReelsCount,
          carousels_count: evalCarouselsCount,
          extra_works_count: evalExtraCount,
          returned_pieces_count: evalReturnedCount,
          correction_reasons: evalCorrectionReasons,
          feedback_notes: evalFeedbackNotes
        })
      });

      if (res.ok) {
        fetchTeam();
        setEvalModalOpen(false);
        alert('Evaluación semanal registrada exitosamente.');
      } else {
        alert('Error al registrar evaluación');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSavingEval(false);
    }
  };

  const handleResetCanonical = async () => {
    if (!confirm('¿Deseas restablecer el equipo canónico (Isabelle, Angie, Adis, Mariana, Eleonora)?')) return;
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

  // Filtros de evaluaciones por diseñadora para modal de perfil
  const getEvaluationsForMember = (memberId: string) => {
    return designerEvaluations.filter(e => e.member_id === memberId || (e.designer_name || '').toLowerCase() === (viewingMember?.name || '').toLowerCase());
  };

  // Total de piezas calculadas en tiempo real para modal de evaluación
  const evalTotalCalculated = evalStaticCount + evalReelsCount + evalCarouselsCount + evalExtraCount;
  const evalErrorRateCalculated = evalTotalCalculated > 0 ? ((evalReturnedCount / evalTotalCalculated) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-400" />
              Recursos Humanos, Perfiles & Auditoría de Diseño
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestión integral del equipo, perfiles con habilidades blandas/duras, y auditoría semanal de los lunes para diseñadoras (Adis vs Mariana).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEvalModal('Adis')}
              className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/40 transition"
            >
              <Palette className="w-4 h-4" />
              Evaluar Lunes (Adis / Mariana)
            </button>

            <button
              onClick={handleResetCanonical}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              title="Sincronizar y limpiar duplicados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
              Sincronizar
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('TEAM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'TEAM'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            👥 Equipo & Perfiles ({members.length})
          </button>

          <button
            onClick={() => setActiveTab('DESIGN_AUDIT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'DESIGN_AUDIT'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            🎨 Auditoría de Diseño: Adis vs Mariana (Lunes)
            {designerStats?.comparison && (
              <span className="ml-1 px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono text-amber-300">
                {designerEvaluations.length} semanas
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'PAYMENTS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            💰 Historial de Pagos & Liquidaciones ({recentPayments.length})
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: EQUIPO & PERFILES (HABILIDADES BLANDAS Y DURAS)          */}
      {/* ============================================================== */}
      {activeTab === 'TEAM' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const isIsabelle = member.id === 'tm_isabelle';
              const isAdis = member.id === 'tm_adis';
              const isMariana = member.id === 'tm_mariana';
              const isEleonora = member.id === 'tm_eleonora';

              let softSkills: string[] = [];
              let hardSkills: string[] = [];
              try {
                softSkills = member.soft_skills ? JSON.parse(member.soft_skills) : [];
              } catch {}
              try {
                hardSkills = member.hard_skills ? JSON.parse(member.hard_skills) : [];
              } catch {}

              return (
                <div 
                  key={member.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header Colaborador */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-100">{member.name}</h3>
                          {isIsabelle && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              Socia / CM
                            </span>
                          )}
                          {(isAdis || isMariana) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Palette className="w-3 h-3" />
                              Diseñadora
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{member.role}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black font-mono text-emerald-400">
                          ${member.monthly_salary} <span className="text-xs font-normal text-slate-400 font-sans">USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ${(member.monthly_salary / 2).toFixed(2)} / quincena
                        </div>
                      </div>
                    </div>

                    {/* Regla de Compensación */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Regla Cambiaria:</span>
                        <span className="font-mono font-bold text-orange-400">
                          {isIsabelle ? '★ Tasa Euro Incentivo' : isEleonora ? 'Binance USDT' : 'Tasa Oficial BCV'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {member.incentive_rule || member.notes}
                      </p>
                    </div>

                    {/* Habilidades Blandas (Soft Skills) */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Habilidades Blandas
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">({softSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {softSkills.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">Sin habilidades registradas</span>
                        ) : (
                          softSkills.map((s, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
                            >
                              {s}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Habilidades Duras (Hard Skills) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-cyan-400" />
                          Habilidades Duras
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">({hardSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {hardSkills.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">Sin habilidades registradas</span>
                        ) : (
                          hardSkills.map((h, idx) => (
                            <span 
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium"
                            >
                              {h}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Colaborador */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenProfileModal(member)}
                      className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      Ver Perfil & Histórico
                    </button>

                    <button
                      onClick={() => handleOpenPayModal(member)}
                      className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition border border-emerald-500/30"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Pagar
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                      title="Editar salario o método"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: AUDITORÍA DE DISEÑO: ADIS VS MARIANA (EVALUACIÓN LUNES) */}
      {/* ============================================================== */}
      {activeTab === 'DESIGN_AUDIT' && (
        <div className="space-y-6">
          {/* Tarjetas Diagnósticas de Auditoría */}
          {designerStats?.comparison && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Card 1: Diseñadora con Menor Error (Más Precisa) */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  <span>👑 Mayor Calidad / Menor Error</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {designerStats.adis.globalErrorRate < designerStats.mariana.globalErrorRate ? 'Adis' : 'Mariana'}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                  Tasa de Error: {Math.min(designerStats.adis.globalErrorRate, designerStats.mariana.globalErrorRate)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                  {designerStats.adis.globalErrorRate < designerStats.mariana.globalErrorRate
                    ? `Adis tuvo solo ${designerStats.adis.returnedPieces} fichas devueltas de ${designerStats.adis.totalPieces} piezas producidas.`
                    : `Mariana tuvo solo ${designerStats.mariana.returnedPieces} fichas devueltas.`}
                </div>
              </div>

              {/* Card 2: Alerta de Fichas Devueltas (A quién se le devuelve más) */}
              <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <span>⚠️ Más Fichas Devueltas</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {designerStats.comparison.mostReturned}
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-1">
                  {Math.max(designerStats.adis.returnedPieces, designerStats.mariana.returnedPieces)} Fichas Rechazadas
                </div>
                <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                  Mariana: {designerStats.mariana.returnedPieces} devueltas ({designerStats.mariana.globalErrorRate}%) vs Adis: {designerStats.adis.returnedPieces} devueltas ({designerStats.adis.globalErrorRate}%).
                </div>
              </div>

              {/* Card 3: Volumen Total de Piezas */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>📦 Producción del Período</span>
                  <Layers className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {designerStats.comparison.totalTeamPieces} <span className="text-xs font-sans text-slate-400">piezas</span>
                </div>
                <div className="text-xs font-mono text-slate-300 mt-1">
                  Adis: {designerStats.adis.totalPieces} | Mariana: {designerStats.mariana.totalPieces}
                </div>
                <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                  {designerStats.comparison.totalTeamReturned} fichas devueltas en total ({designerStats.comparison.teamAverageErrorRate}% global).
                </div>
              </div>

              {/* Card 4: Especialidad de Formato */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  <span>🎬 Especialidad de Formatos</span>
                  <Palette className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xs space-y-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Mariana (Reels):</span>
                    <strong className="font-mono text-cyan-400">{designerStats.mariana.reels} Reels</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Adis (Estáticos/Carrusel):</span>
                    <strong className="font-mono text-orange-400">{designerStats.adis.staticPosts} est. / {designerStats.adis.carousels} carr.</strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                  Mariana lidera en video vertical y Adis en piezas gráficas fijas.
                </div>
              </div>
            </div>
          )}

          {/* Gráfica Dinámica Semanal: Adis vs Mariana */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                  Evolución Semanal de Calidad y Volumen (Auditorías de los Lunes)
                </h3>
                <p className="text-xs text-slate-400">
                  Visualiza el rendimiento de la semana que pasó: piezas diseñadas, fichas devueltas y porcentaje de error de cada diseñadora.
                </p>
              </div>

              {/* Botones de selector de vista del gráfico */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setDesignChartType('COMPARISON')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    designChartType === 'COMPARISON'
                      ? 'bg-orange-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Comparativa Adis vs Mariana
                </button>
                <button
                  onClick={() => setDesignChartType('ERROR_RATE')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    designChartType === 'ERROR_RATE'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  % Tasa de Error & Devoluciones
                </button>
                <button
                  onClick={() => setDesignChartType('FORMATS')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    designChartType === 'FORMATS'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Por Formato (Estático, Reel, Carrusel)
                </button>
              </div>
            </div>

            {/* Canvas del Gráfico Semanal */}
            {weeklySeries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No hay evaluaciones semanales registradas todavía.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-64 flex items-end gap-6 pt-8 pb-3 px-4 border-b border-slate-800 overflow-x-auto bg-slate-950/60 rounded-xl">
                  {weeklySeries.map((w: any) => {
                    const isSelected = selectedWeekDetail?.week_start_date === w.week_start_date;

                    if (designChartType === 'COMPARISON') {
                      // Vista 1: Barras duales Adis (Naranja) vs Mariana (Cian)
                      const maxVal = Math.max(...weeklySeries.map((s: any) => Math.max(s.adis.total, s.mariana.total)), 30);
                      const adisH = Math.max(Math.round((w.adis.total / maxVal) * 100), 10);
                      const marianaH = Math.max(Math.round((w.mariana.total / maxVal) * 100), 10);

                      return (
                        <div
                          key={w.week_start_date}
                          onClick={() => setSelectedWeekDetail(isSelected ? null : w)}
                          className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 cursor-pointer p-2 rounded-xl transition ${
                            isSelected ? 'bg-slate-800/80 ring-2 ring-orange-500/50' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="w-full flex items-end justify-center gap-2 h-44">
                            {/* Barra Adis */}
                            <div className="flex-1 flex flex-col items-center h-full justify-end group">
                              <span className="text-[10px] font-mono font-bold text-orange-400 mb-1 opacity-90 group-hover:opacity-100">
                                {w.adis.total}
                              </span>
                              <div
                                style={{ height: `${adisH}%` }}
                                className="w-full max-w-[28px] bg-orange-500 rounded-t-lg transition-all group-hover:brightness-125 relative shadow-lg shadow-orange-950/50"
                                title={`Adis: ${w.adis.total} piezas (${w.adis.returned} devueltas - ${w.adis.errorRate}%)`}
                              >
                                {w.adis.returned > 0 && (
                                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-300 bg-black/60 px-1 rounded">
                                    -{w.adis.returned}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Barra Mariana */}
                            <div className="flex-1 flex flex-col items-center h-full justify-end group">
                              <span className="text-[10px] font-mono font-bold text-cyan-400 mb-1 opacity-90 group-hover:opacity-100">
                                {w.mariana.total}
                              </span>
                              <div
                                style={{ height: `${marianaH}%` }}
                                className="w-full max-w-[28px] bg-cyan-500 rounded-t-lg transition-all group-hover:brightness-125 relative shadow-lg shadow-cyan-950/50"
                                title={`Mariana: ${w.mariana.total} piezas (${w.mariana.returned} devueltas - ${w.mariana.errorRate}%)`}
                              >
                                {w.mariana.returned > 0 && (
                                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-300 bg-black/60 px-1 rounded">
                                    -{w.mariana.returned}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[11px] font-semibold text-center whitespace-nowrap mt-1 ${
                            isSelected ? 'text-orange-400 font-bold' : 'text-slate-400'
                          }`}>
                            {w.week_label}
                          </span>
                        </div>
                      );
                    }

                    if (designChartType === 'ERROR_RATE') {
                      // Vista 2: Tasa de error comparada (%)
                      const maxRate = Math.max(...weeklySeries.map((s: any) => Math.max(s.adis.errorRate, s.mariana.errorRate)), 20);
                      const adisRateH = Math.max(Math.round((w.adis.errorRate / maxRate) * 100), 8);
                      const marianaRateH = Math.max(Math.round((w.mariana.errorRate / maxRate) * 100), 8);

                      return (
                        <div
                          key={w.week_start_date}
                          onClick={() => setSelectedWeekDetail(isSelected ? null : w)}
                          className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 cursor-pointer p-2 rounded-xl transition ${
                            isSelected ? 'bg-slate-800/80 ring-2 ring-amber-500/50' : 'hover:bg-slate-900/50'
                          }`}
                        >
                          <div className="w-full flex items-end justify-center gap-2 h-44">
                            {/* Adis Error % */}
                            <div className="flex-1 flex flex-col items-center h-full justify-end group">
                              <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1">
                                {w.adis.errorRate}%
                              </span>
                              <div
                                style={{ height: `${adisRateH}%` }}
                                className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                                  w.adis.errorRate <= 5 ? 'bg-emerald-500' : (w.adis.errorRate <= 10 ? 'bg-amber-500' : 'bg-red-500')
                                }`}
                                title={`Adis: ${w.adis.errorRate}% (${w.adis.returned} fichas devueltas)`}
                              />
                            </div>

                            {/* Mariana Error % */}
                            <div className="flex-1 flex flex-col items-center h-full justify-end group">
                              <span className="text-[10px] font-mono font-bold text-amber-300 mb-1">
                                {w.mariana.errorRate}%
                              </span>
                              <div
                                style={{ height: `${marianaRateH}%` }}
                                className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                                  w.mariana.errorRate <= 5 ? 'bg-emerald-500' : (w.mariana.errorRate <= 10 ? 'bg-amber-500' : 'bg-red-500')
                                }`}
                                title={`Mariana: ${w.mariana.errorRate}% (${w.mariana.returned} fichas devueltas)`}
                              />
                            </div>
                          </div>

                          <span className={`text-[11px] font-semibold text-center whitespace-nowrap mt-1 ${
                            isSelected ? 'text-amber-400 font-bold' : 'text-slate-400'
                          }`}>
                            {w.week_label}
                          </span>
                        </div>
                      );
                    }

                    // Vista 3: Formatos desglosados (Estáticos vs Reels vs Carruseles)
                    return (
                      <div
                        key={w.week_start_date}
                        onClick={() => setSelectedWeekDetail(isSelected ? null : w)}
                        className={`flex-1 min-w-[140px] flex flex-col items-center gap-2 cursor-pointer p-2 rounded-xl transition ${
                          isSelected ? 'bg-slate-800/80 ring-2 ring-cyan-500/50' : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="w-full flex items-end justify-center gap-2 h-44">
                          {/* Adis Stacked Formats */}
                          <div className="flex-1 flex flex-col items-center h-full justify-end">
                            <span className="text-[9px] font-bold text-orange-400 mb-0.5">Adis</span>
                            <div className="w-full max-w-[28px] h-36 rounded-t-lg overflow-hidden flex flex-col-reverse shadow">
                              <div style={{ height: `${(w.adis.static / w.adis.total) * 100}%` }} className="bg-orange-500" title={`Estáticos: ${w.adis.static}`} />
                              <div style={{ height: `${(w.adis.reels / w.adis.total) * 100}%` }} className="bg-cyan-500" title={`Reels: ${w.adis.reels}`} />
                              <div style={{ height: `${(w.adis.carousels / w.adis.total) * 100}%` }} className="bg-purple-500" title={`Carruseles: ${w.adis.carousels}`} />
                              <div style={{ height: `${(w.adis.extra / w.adis.total) * 100}%` }} className="bg-pink-500" title={`Extra: ${w.adis.extra}`} />
                            </div>
                          </div>

                          {/* Mariana Stacked Formats */}
                          <div className="flex-1 flex flex-col items-center h-full justify-end">
                            <span className="text-[9px] font-bold text-cyan-400 mb-0.5">Mariana</span>
                            <div className="w-full max-w-[28px] h-36 rounded-t-lg overflow-hidden flex flex-col-reverse shadow">
                              <div style={{ height: `${(w.mariana.static / w.mariana.total) * 100}%` }} className="bg-orange-500" title={`Estáticos: ${w.mariana.static}`} />
                              <div style={{ height: `${(w.mariana.reels / w.mariana.total) * 100}%` }} className="bg-cyan-500" title={`Reels: ${w.mariana.reels}`} />
                              <div style={{ height: `${(w.mariana.carousels / w.mariana.total) * 100}%` }} className="bg-purple-500" title={`Carruseles: ${w.mariana.carousels}`} />
                              <div style={{ height: `${(w.mariana.extra / w.mariana.total) * 100}%` }} className="bg-pink-500" title={`Extra: ${w.mariana.extra}`} />
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400 text-center whitespace-nowrap mt-1">
                          {w.week_label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Leyenda interactiva del gráfico */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-1 px-2">
                  {designChartType === 'COMPARISON' ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-orange-500 inline-block" />
                        <span className="text-slate-300 font-semibold">Adis (Total Piezas)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                        <span className="text-slate-300 font-semibold">Mariana (Total Piezas)</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">• Número rojo superior indica fichas devueltas por corrección</span>
                    </div>
                  ) : designChartType === 'ERROR_RATE' ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                        <span className="text-slate-300">Excelente (&lt; 5% error)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                        <span className="text-slate-300">Moderado (5% - 10%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-red-500 inline-block" />
                        <span className="text-slate-300">Atención (&gt; 10% error)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500" /><span className="text-slate-300">Post Estático</span></div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-500" /><span className="text-slate-300">Reels</span></div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500" /><span className="text-slate-300">Carrusel</span></div>
                      <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-pink-500" /><span className="text-slate-300">Trabajos Extra</span></div>
                    </div>
                  )}

                  <span className="text-slate-400 text-[11px]">
                    Haz clic en una semana para desplegar detalles
                  </span>
                </div>

                {/* Detalle Desplegado de Semana Seleccionada */}
                {selectedWeekDetail && (
                  <div className="mt-4 p-4 bg-slate-950 border border-orange-500/40 rounded-xl animate-in fade-in space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-orange-400 flex items-center gap-2">
                        <span>🔍</span>
                        Detalle de la {selectedWeekDetail.week_label} (Inicio: {selectedWeekDetail.week_start_date})
                      </h4>
                      <button
                        onClick={() => setSelectedWeekDetail(null)}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        Cerrar detalle ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Desglose Adis */}
                      <div className="bg-slate-900/90 border border-orange-500/30 p-3.5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-orange-400 text-xs">🎨 Adis</span>
                          <span className="font-mono text-xs font-bold text-slate-200">
                            {selectedWeekDetail.adis.total} piezas ({selectedWeekDetail.adis.returned} devueltas • {selectedWeekDetail.adis.errorRate}% error)
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px] text-center mb-2">
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Estáticos</span>{selectedWeekDetail.adis.static}</div>
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Reels</span>{selectedWeekDetail.adis.reels}</div>
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Carruseles</span>{selectedWeekDetail.adis.carousels}</div>
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Extras</span>{selectedWeekDetail.adis.extra}</div>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <strong>Clientes atendidos:</strong> {selectedWeekDetail.adis.clients?.join(', ') || 'N/A'}
                        </div>
                        {selectedWeekDetail.adis.reasons && (
                          <div className="text-[11px] text-amber-300/90 mt-1">
                            <strong>Motivos de corrección:</strong> {selectedWeekDetail.adis.reasons}
                          </div>
                        )}
                      </div>

                      {/* Desglose Mariana */}
                      <div className="bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-cyan-400 text-xs">🎬 Mariana</span>
                          <span className="font-mono text-xs font-bold text-slate-200">
                            {selectedWeekDetail.mariana.total} piezas ({selectedWeekDetail.mariana.returned} devueltas • {selectedWeekDetail.mariana.errorRate}% error)
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px] text-center mb-2">
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Estáticos</span>{selectedWeekDetail.mariana.static}</div>
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Reels</span>{selectedWeekDetail.mariana.reels}</div>
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Carruseles</span>{selectedWeekDetail.mariana.carousels}</div>
                          <div className="bg-slate-950 p-1.5 rounded"><span className="text-slate-400 block text-[9px]">Extras</span>{selectedWeekDetail.mariana.extra}</div>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <strong>Clientes atendidos:</strong> {selectedWeekDetail.mariana.clients?.join(', ') || 'N/A'}
                        </div>
                        {selectedWeekDetail.mariana.reasons && (
                          <div className="text-[11px] text-amber-300/90 mt-1">
                            <strong>Motivos de corrección:</strong> {selectedWeekDetail.mariana.reasons}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabla Histórica de Evaluaciones Semanales de los Lunes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-400" />
                  Registro Histórico de Evaluaciones de los Lunes
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose por cliente, piezas producidas (estáticos, reels, carruseles, extra), fichas devueltas y porcentaje de error grabado.
                </p>
              </div>

              <button
                onClick={() => handleOpenEvalModal()}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Evaluación
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Semana (Lunes)</th>
                    <th className="py-3 px-4">Diseñadora</th>
                    <th className="py-3 px-4">Clientes Trabajados</th>
                    <th className="py-3 px-2 text-center">Estáticos</th>
                    <th className="py-3 px-2 text-center">Reels</th>
                    <th className="py-3 px-2 text-center">Carrusel</th>
                    <th className="py-3 px-2 text-center">Extra</th>
                    <th className="py-3 px-3 text-right">Total Piezas</th>
                    <th className="py-3 px-3 text-right">Fichas Devueltas</th>
                    <th className="py-3 px-3 text-right">% Error</th>
                    <th className="py-3 px-4">Motivos de Corrección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {designerEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                        No hay evaluaciones registradas.
                      </td>
                    </tr>
                  ) : designerEvaluations.map((ev) => {
                    const isAdis = (ev.designer_name || '').toLowerCase().includes('adis');
                    const error = Number(ev.error_rate_percent) || 0;
                    let clients: string[] = [];
                    try {
                      clients = JSON.parse(ev.clients_worked || '[]');
                    } catch {
                      clients = (ev.clients_worked || '').split(',').map((s: string) => s.trim());
                    }

                    return (
                      <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-300 font-semibold">{ev.week_label}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isAdis ? 'bg-orange-500/20 text-orange-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {ev.designer_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300 max-w-[200px] truncate" title={clients.join(', ')}>
                          {clients.join(', ')}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-200">{ev.static_posts_count}</td>
                        <td className="py-3 px-2 text-center text-slate-200">{ev.reels_count}</td>
                        <td className="py-3 px-2 text-center text-slate-200">{ev.carousels_count}</td>
                        <td className="py-3 px-2 text-center text-slate-200">{ev.extra_works_count}</td>
                        <td className="py-3 px-3 text-right font-bold text-white">{ev.total_pieces}</td>
                        <td className="py-3 px-3 text-right font-bold text-amber-400">
                          {ev.returned_pieces_count > 0 ? `${ev.returned_pieces_count} fichas` : '0'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                            error <= 5 ? 'bg-emerald-500/20 text-emerald-400' : (error <= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-400')
                          }`}>
                            {error}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400 max-w-[220px] truncate" title={ev.correction_reasons}>
                          {ev.correction_reasons || 'Sin observaciones'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: HISTORIAL DE PAGOS & NÓMINA                             */}
      {/* ============================================================== */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Historial de Pagos y Liquidaciones de Nómina
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {recentPayments.length} comprobantes registrados
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
      )}

      {/* ============================================================== */}
      {/* MODAL 1: VER PERFIL COMPLETO & HABILIDADES DEL COLABORADOR     */}
      {/* ============================================================== */}
      {profileModalOpen && viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl relative my-8">
            <button
              onClick={() => setProfileModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado Perfil */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl font-black shadow-lg shadow-orange-950/40">
                {viewingMember.name[0]}
              </div>
              <div>
                <h3 className="font-black text-xl text-white flex items-center gap-2">
                  {viewingMember.name}
                  {viewingMember.id === 'tm_isabelle' && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                      Socia / CM
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">{viewingMember.role}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300 font-mono">
                  <span>Asignación: <strong className="text-emerald-400">${viewingMember.monthly_salary} USD</strong></span>
                  <span>•</span>
                  <span>Método: <strong>{viewingMember.payment_method}</strong></span>
                  <span>•</span>
                  <span>Regla: <strong>{viewingMember.rate_rule}</strong></span>
                </div>
              </div>
            </div>

            {/* Sección: Habilidades Blandas */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Habilidades Blandas (Soft Skills)
                </label>
                <span className="text-[11px] text-slate-400">Puntualidad, liderazgo, comunicación...</span>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl min-h-[48px] mb-2.5">
                {memberSoftSkills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSoftSkill(idx)}
                      className="hover:text-red-400 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Agregar habilidad blanda (ej. Comunicación Asertiva, Proactividad...)"
                  value={newSoftInput}
                  onChange={(e) => setNewSoftInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSoftSkill(); } }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddSoftSkill}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* Sección: Habilidades Duras */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Habilidades Duras (Hard Skills)
                </label>
                <span className="text-[11px] text-slate-400">Software, herramientas, técnicas...</span>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl min-h-[48px] mb-2.5">
                {memberHardSkills.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveHardSkill(idx)}
                      className="hover:text-red-400 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Agregar habilidad dura (ej. Adobe Illustrator, CapCut Pro, Copywriting...)"
                  value={newHardInput}
                  onChange={(e) => setNewHardInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddHardSkill(); } }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddHardSkill}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* Histórico de Evaluaciones del Colaborador */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-400" />
                Histórico de Evaluaciones Registradas
              </h4>

              {getEvaluationsForMember(viewingMember.id).length === 0 ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  No hay evaluaciones semanales de diseño registradas para {viewingMember.name}.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {getEvaluationsForMember(viewingMember.id).map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200">{ev.week_label}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ev.total_pieces} piezas ({ev.static_posts_count} est., {ev.reels_count} reels, {ev.carousels_count} carr., {ev.extra_works_count} extra)
                        </div>
                        {ev.correction_reasons && (
                          <div className="text-[10px] text-amber-300 mt-0.5">
                            Motivo: {ev.correction_reasons}
                          </div>
                        )}
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-amber-400">
                          {ev.returned_pieces_count} devueltas
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Error: {ev.error_rate_percent}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSaveSkills}
                disabled={savingSkills}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-950/40"
              >
                {savingSkills ? 'Guardando...' : 'Guardar Habilidades'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: REGISTRAR EVALUACIÓN DEL LUNES (AUDITORÍA DE DISEÑO)   */}
      {/* ============================================================== */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative my-8">
            <button
              onClick={() => setEvalModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                Auditoría Semanal de los Lunes
              </span>
            </div>
            <h3 className="font-black text-lg mb-1 text-white">
              Registrar Evaluación de Diseño
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Revisa el tablero de diseño de la semana que pasó y registra los clientes, formatos producidos y fichas devueltas por correcciones.
            </p>

            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              {/* Diseñadora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Diseñadora</label>
                  <select
                    value={evalDesignerId}
                    onChange={(e) => {
                      setEvalDesignerId(e.target.value);
                      setEvalDesignerName(e.target.value === 'tm_mariana' ? 'Mariana' : 'Adis');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="tm_adis">Adis (Diseño Gráfico)</option>
                    <option value="tm_mariana">Mariana (Audiovisual & Motion)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fecha del Lunes</label>
                  <input
                    type="date"
                    required
                    value={evalWeekDate}
                    onChange={(e) => setEvalWeekDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Nombre de la Semana */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Etiqueta de la Semana</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Semana 1 (02 Noviembre)"
                  value={evalWeekLabel}
                  onChange={(e) => setEvalWeekLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                />
              </div>

              {/* Clientes Atendidos */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Clientes Trabajados en la Semana</label>
                <input
                  type="text"
                  required
                  placeholder="Separados por comas: Feminaid, CC Garcia, SOVEMO..."
                  value={evalClientsText}
                  onChange={(e) => setEvalClientsText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                />
              </div>

              {/* Conteo por Formatos */}
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Conteo de Piezas Producidas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">🖼️ Post Estático</span>
                    <input
                      type="number"
                      min="0"
                      value={evalStaticCount}
                      onChange={(e) => setEvalStaticCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-mono font-bold text-slate-100 outline-none"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">🎬 Reels / Video</span>
                    <input
                      type="number"
                      min="0"
                      value={evalReelsCount}
                      onChange={(e) => setEvalReelsCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-mono font-bold text-slate-100 outline-none"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">📑 Carruseles</span>
                    <input
                      type="number"
                      min="0"
                      value={evalCarouselsCount}
                      onChange={(e) => setEvalCarouselsCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-mono font-bold text-slate-100 outline-none"
                    />
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">⚡ Trabajos Extra</span>
                    <input
                      type="number"
                      min="0"
                      value={evalExtraCount}
                      onChange={(e) => setEvalExtraCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-mono font-bold text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fichas Devueltas y Tasa de Error Calculada */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="font-bold text-amber-300 block">Fichas Devueltas por Corrección</label>
                    <span className="text-[11px] text-slate-400">Piezas con cambios requeridos por cliente/dirección</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={evalReturnedCount}
                    onChange={(e) => setEvalReturnedCount(parseInt(e.target.value, 10) || 0)}
                    className="w-16 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-center font-mono font-bold text-base text-amber-400 outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Total Producido: <strong className="text-white">{evalTotalCalculated} piezas</strong></span>
                  <span className="text-amber-400 font-bold">Tasa de Error: {evalErrorRateCalculated}%</span>
                </div>
              </div>

              {/* Motivo de Correcciones */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motivos Frecuentes de Corrección</label>
                <input
                  type="text"
                  placeholder="Ej. Desfase de audio en reel, error ortográfico, margen de zona segura..."
                  value={evalCorrectionReasons}
                  onChange={(e) => setEvalCorrectionReasons(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                />
              </div>

              {/* Feedback Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas de Retroalimentación / Acuerdos</label>
                <textarea
                  rows={2}
                  placeholder="Recomendaciones para la diseñadora..."
                  value={evalFeedbackNotes}
                  onChange={(e) => setEvalFeedbackNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEvalModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEval}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-950/40"
                >
                  {savingEval ? 'Guardando...' : 'Grabar Evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: REGISTRAR PAGO DE NÓMINA                             */}
      {/* ============================================================== */}
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

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tasa de Cambio a Aplicar</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRateTypeChange('BCV')}
                    className={`p-2 rounded-xl border text-center transition ${
                      rateTypeApplied === 'BCV'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Dólar BCV</div>
                    <div className="font-mono text-[11px]">{rates?.bcv_usd || 888.12}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateTypeChange('EURO')}
                    className={`p-2 rounded-xl border text-center transition ${
                      rateTypeApplied === 'EURO'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Euro BCV</div>
                    <div className="font-mono text-[11px]">{rates?.bcv_eur || 989.72}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateTypeChange('BINANCE')}
                    className={`p-2 rounded-xl border text-center transition ${
                      rateTypeApplied === 'BINANCE'
                        ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>Binance P2P</div>
                    <div className="font-mono text-[11px]">{rates?.binance_usdt || 1007.40}</div>
                  </button>
                </div>
              </div>

              {rateTypeApplied !== 'BINANCE' && paymentMethod !== 'BINANCE' && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">Total a Liquidar en Bs:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    Bs. {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                  >
                    <option value="PAGO_MOVIL">Pago Móvil</option>
                    <option value="TRANSFERENCIA_BS">Transferencia Bs</option>
                    <option value="BINANCE">Binance USDT</option>
                    <option value="EFECTIVO">Efectivo USD</option>
                    <option value="ZELLE">Zelle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Referencia Bancaria</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. Ref #18492"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Detalles adicionales del pago..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPay}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-950/40"
                >
                  {savingPay ? 'Registrando...' : 'Confirmar y Pagar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: EDITAR SALARIO O MÉTODO DEL COLABORADOR               */}
      {/* ============================================================== */}
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
                <label className="block font-semibold text-slate-300 mb-1">Salario Mensual ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Método de Pago Preferido</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                >
                  <option value="PAGO_MOVIL">Pago Móvil</option>
                  <option value="TRANSFERENCIA_BS">Transferencia Bs</option>
                  <option value="BINANCE">Binance USDT</option>
                  <option value="EFECTIVO">Efectivo USD</option>
                  <option value="ZELLE">Zelle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas / Regla</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition shadow-lg shadow-orange-950/40"
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
