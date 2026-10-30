'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Printer, FileText, CheckCircle2, 
  HelpCircle, ArrowRight, DollarSign, Calculator, ChevronDown 
} from 'lucide-react';

interface NewEmissionProps {
  clients: any[];
  rates: any;
  initialClient?: any;
  onEmissionSuccess: (createdDoc: any) => void;
}

// Categorías oficiales de servicios y líneas de negocio
const SERVICE_CATEGORIES = [
  { id: 'MARKETING_RRSS', name: '📱 Manejo de Redes', color: 'text-orange-400' },
  { id: 'MARKETING_ADS', name: '🚀 Meta Ads / Pauta', color: 'text-cyan-400' },
  { id: 'MARKETING_OTROS', name: '💡 Otros Marketing', color: 'text-purple-400' },
  { id: 'DESARROLLO', name: '💻 Desarrollo Web / Software', color: 'text-blue-400' },
  { id: 'GRABACIONES', name: '🎬 Grabaciones Extra', color: 'text-amber-400' },
  { id: 'FORMACION', name: '🎓 Formación / Cursos', color: 'text-emerald-400' },
  { id: 'MATERIAL_IMPRESO', name: '🖨️ Material Impreso / POP', color: 'text-pink-400' },
];

function detectCategory(desc: string): string {
  const t = (desc || '').toLowerCase();
  if (t.includes('ads') || t.includes('pauta') || t.includes('meta ads') || t.includes('facebook') || t.includes('google') || t.includes('campaña') || t.includes('anuncio')) return 'MARKETING_ADS';
  if (t.includes('web') || t.includes('software') || t.includes('landing') || t.includes('página') || t.includes('desarrollo') || t.includes('sistema') || t.includes('tienda') || t.includes('app') || t.includes('portal')) return 'DESARROLLO';
  if (t.includes('grabaci') || t.includes('rodaje') || t.includes('cobertura') || t.includes('video') || t.includes('audiovisual')) return 'GRABACIONES';
  if (t.includes('formaci') || t.includes('taller') || t.includes('curso') || t.includes('capacitaci') || t.includes('clase') || t.includes('entrenamiento')) return 'FORMACION';
  if (t.includes('impres') || t.includes('rotul') || t.includes('pendon') || t.includes('pop') || t.includes('papeler') || t.includes('tarjeta') || t.includes('pulsera')) return 'MATERIAL_IMPRESO';
  if (t.includes('branding') || t.includes('logo') || t.includes('identidad') || t.includes('manual') || t.includes('auditor')) return 'MARKETING_OTROS';
  return 'MARKETING_RRSS';
}

function addBusinessDays(startDateStr: string, businessDays: number = 3): string {
  const date = new Date(startDateStr + 'T12:00:00');
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return date.toISOString().split('T')[0];
}

export default function NewEmissionView({
  clients,
  rates,
  initialClient,
  onEmissionSuccess
}: NewEmissionProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClient?.id || (clients[0]?.id || ''));
  const [docType, setDocType] = useState<'FORMA_LIBRE' | 'RECIBO' | 'PRESUPUESTO'>('RECIBO');
  const [isProspectMode, setIsProspectMode] = useState<boolean>(false);
  const [prospectName, setProspectName] = useState<string>('');
  const [prospectRif, setProspectRif] = useState<string>('');
  const [prospectPhone, setProspectPhone] = useState<string>('');
  const [prospectEmail, setProspectEmail] = useState<string>('');
  const [prospectAddress, setProspectAddress] = useState<string>('');

  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [rateType, setRateType] = useState<string>('BCV');
  const [customRate, setCustomRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFERENCIA_BS');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedRif, setSelectedRif] = useState<string>('');

  // Retenciones Fiscales (Agentes de Retención SENIAT)
  const [applyWithholding, setApplyWithholding] = useState<boolean>(false);
  const [ivaRetentionPercent, setIvaRetentionPercent] = useState<number>(75);
  const [islrRetentionPercent, setIslrRetentionPercent] = useState<number>(2);

  // Items
  const [items, setItems] = useState<any[]>([
    { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 150.0 }
  ]);

  // When selected client changes, update defaults
  useEffect(() => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (client) {
      setDocType(client.preferred_document === 'FORMA_LIBRE' ? 'FORMA_LIBRE' : 'RECIBO');
      setRateType(client.default_rate_type || 'BCV');
      const rifs = (client.rif || '').split(/[,/|]/).map((r: string) => r.trim()).filter(Boolean);
      setSelectedRif(rifs[0] || client.rif || '');
      
      const newItems = [];
      if (client.base_monthly_fee > 0) {
        newItems.push({
          description: `Manejo de Redes Sociales (${new Date().toLocaleString('es-VE', { month: 'long' })})`,
          category: 'MARKETING_RRSS',
          unit: '1.0',
          quantity: 1,
          amount: client.base_monthly_fee
        });
      }
      if (client.meta_ads_budget > 0) {
        newItems.push({
          description: `Pauta Publicitaria Meta ADS`,
          category: 'MARKETING_ADS',
          unit: '1.0',
          quantity: 1,
          amount: client.meta_ads_budget
        });
      }
      if (newItems.length > 0) {
        setItems(newItems);
      }

      // Detectar si es agente de retención
      const isWithholder = client.is_withholding_agent === 1 || client.id === 'mantica' || client.id === 'cc-garcia';
      setApplyWithholding(isWithholder);
      setIvaRetentionPercent(client.iva_retention_percent || 75);
      setIslrRetentionPercent(client.islr_retention_percent || 2);

      // Detectar método de pago preferido
      if (client.id === 'calibre' || client.default_rate_type === 'PAYPAL') {
        setPaymentMethod('PAYPAL');
      }
    }
  }, [selectedClientId, clients]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Tasa efectiva
  const bcvRate = Number(rates?.bcv_usd || 866.56);
  const binanceRate = Number(rates?.binance_usdt || 920.00);
  const avgRate = Number(rates?.average_usd || ((bcvRate + binanceRate) / 2));
  const eurRate = Number(rates?.bcv_eur || (bcvRate * 1.08));

  let effectiveRate = bcvRate;
  if (rateType === 'BINANCE') effectiveRate = binanceRate;
  else if (rateType === 'PROMEDIO') effectiveRate = avgRate;
  else if (rateType === 'EURO') effectiveRate = eurRate;
  else if (rateType === 'EFECTIVO' || rateType === 'PAYPAL') effectiveRate = bcvRate;
  else if (rateType === 'CUSTOM') effectiveRate = parseFloat(customRate) || bcvRate;

  // Calculos
  const totalAmountCurrency = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const subtotalBs = currency === 'USD' ? totalAmountCurrency * effectiveRate : totalAmountCurrency;
  const ivaRate = docType === 'FORMA_LIBRE' ? 0.16 : 0.0;
  const ivaAmountBs = subtotalBs * ivaRate;
  const totalBs = subtotalBs + ivaAmountBs;

  // Retenciones Fiscales (IVA e ISLR para Agentes de Retención SENIAT)
  const isWithholdingActive = applyWithholding && docType === 'FORMA_LIBRE';
  const ivaRetentionAmountBs = isWithholdingActive ? Number(((ivaAmountBs * (ivaRetentionPercent / 100))).toFixed(2)) : 0;
  const islrRetentionAmountBs = isWithholdingActive ? Number(((subtotalBs * (islrRetentionPercent / 100))).toFixed(2)) : 0;
  const totalRetentionsBs = ivaRetentionAmountBs + islrRetentionAmountBs;
  const netPayableBs = totalBs - totalRetentionsBs;
  const netPayableUsd = effectiveRate > 0 ? (netPayableBs / effectiveRate) : totalAmountCurrency;

  // Unidad Base BCV
  const baseBsBcv = currency === 'USD' ? totalAmountCurrency * bcvRate * (1 + ivaRate) : totalBs;
  const baseUsdBcv = baseBsBcv / bcvRate;

  const handleAddItem = () => {
    setItems([...items, { description: '', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'description' && !updated[index].categoryManuallySet) {
      updated[index].category = detectCategory(value);
    }
    if (field === 'category') {
      updated[index].categoryManuallySet = true;
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProspectMode) {
      if (!prospectName.trim()) {
        alert('Por favor ingresa el nombre o razón social del prospecto/cliente');
        return;
      }
    } else if (!selectedClientId) {
      alert('Selecciona un cliente');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: docType,
          client_id: isProspectMode ? 'NEW_PROSPECT' : selectedClientId,
          client_rif: isProspectMode ? prospectRif : (selectedRif || selectedClient?.rif),
          prospect_name: prospectName,
          prospect_business_name: prospectName,
          prospect_phone: prospectPhone,
          prospect_email: prospectEmail,
          prospect_address: prospectAddress,
          issue_date: issueDate,
          due_date: docType === 'PRESUPUESTO' ? (dueDate || addBusinessDays(issueDate, 3)) : dueDate,
          currency,
          total_amount_currency: totalAmountCurrency,
          rate_type_applied: rateType,
          custom_rate: rateType === 'CUSTOM' ? effectiveRate : undefined,
          items,
          notes,
          is_withholding_applied: isWithholdingActive,
          iva_retention_percent: ivaRetentionPercent,
          islr_retention_percent: islrRetentionPercent,
          is_paid: docType === 'PRESUPUESTO' ? false : isPaid,
          payment_method: isPaid && docType !== 'PRESUPUESTO' ? paymentMethod : null,
          payment_reference: isPaid && docType !== 'PRESUPUESTO' ? paymentReference : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir');

      onEmissionSuccess(data.document);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatBs = (num: number) => (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-400" />
          Nueva Emisión de Cobro
        </h2>
        <p className="text-xs text-slate-400">
          Elige cliente, modalidad (Forma Libre o Recibo) y define con qué tasa liquidar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner especial cuando es Presupuesto */}
        {docType === 'PRESUPUESTO' && (
          <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-600/20 border border-orange-500/40 rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/30 text-orange-300 flex items-center justify-center text-xl flex-shrink-0">
              💼
            </div>
            <div className="text-xs">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>Modo Presupuesto Online & Cotización Comercial</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-mono font-bold">
                  Validez: 3 Días Hábiles
                </span>
              </h3>
              <p className="text-slate-300 mt-1">
                Se generará una propuesta digital elegante con <strong>enlace público web</strong> listo para enviar por WhatsApp. Incluye botón directo para que el cliente la <strong>descargue en PDF</strong> o la <strong>apruebe de inmediato</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Client Selector & Doc Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client selector / Prospect Mode */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Cliente o Prospecto *
                </label>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setIsProspectMode(false)}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      !isProspectMode ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    👤 Registrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProspectMode(true)}
                    className={`px-2 py-1 rounded-md font-semibold transition ${
                      isProspectMode ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ➕ Nuevo Prospecto
                  </button>
                </div>
              </div>

              {!isProspectMode ? (
                <>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold outline-none"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.rif ? `(${c.rif})` : ''} — Fee: ${c.base_monthly_fee}
                      </option>
                    ))}
                  </select>

                  {selectedClient && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                      <div className="font-semibold text-slate-200">{selectedClient.business_name || selectedClient.name}</div>
                      {(() => {
                        const rifs = (selectedClient.rif || '').split(/[,/|]/).map((r: string) => r.trim()).filter(Boolean);
                        if (rifs.length > 1) {
                          return (
                            <div className="my-2 p-2 bg-slate-900 border border-slate-800 rounded-lg">
                              <span className="text-[10px] text-orange-400 font-bold block mb-1">
                                Este cliente tiene varios RIF. Selecciona el que deseas usar:
                              </span>
                              <div className="flex gap-1.5 flex-wrap">
                                {rifs.map((r: string) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => setSelectedRif(r)}
                                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                                      selectedRif === r
                                        ? 'bg-orange-500 text-white shadow shadow-orange-500/30'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return <div>RIF: {selectedClient.rif || 'Sin RIF'} | Telf: {selectedClient.phone || 'N/A'}</div>;
                      })()}
                      <div className="text-[11px] text-slate-500 truncate">{selectedClient.address || 'Caracas'}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-orange-500/30">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nombre o Empresa del Prospecto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Clínica Dental Sonrisas C.A."
                      value={prospectName}
                      onChange={(e) => setProspectName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">RIF / C.I.</label>
                      <input
                        type="text"
                        placeholder="J-12345678-9"
                        value={prospectRif}
                        onChange={(e) => setProspectRif(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="0414-0000000"
                        value={prospectPhone}
                        onChange={(e) => setProspectPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      placeholder="contacto@empresa.com"
                      value={prospectEmail}
                      onChange={(e) => setProspectEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Document Type (Forma libre vs Recibo vs Presupuesto) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                2. Modalidad del Documento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('RECIBO')}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    docType === 'RECIBO'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-200 shadow-md shadow-orange-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    📄 Recibo
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Comprobante administrativo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType('FORMA_LIBRE')}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    docType === 'FORMA_LIBRE'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    🖨️ Forma Libre
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Factura SENIAT (+16% IVA)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocType('PRESUPUESTO');
                    setDueDate(addBusinessDays(issueDate, 3));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    docType === 'PRESUPUESTO'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                    💼 Presupuesto
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Enlace público + PDF (3 días)
                  </span>
                </button>
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setIssueDate(newDate);
                      if (docType === 'PRESUPUESTO') {
                        setDueDate(addBusinessDays(newDate, 3));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {docType === 'PRESUPUESTO' ? 'Válido Hasta (3 Días Hábiles)' : 'Fecha Vencimiento'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {docType === 'PRESUPUESTO' && (
                <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1.5 font-medium">
                  <span>⚡</span>
                  <span>Calculado automáticamente para 3 días laborables (excluye fines de semana).</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Rate Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              3. Tasa de Cambio para Liquidar este Cobro
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Puedes cambiarla según la disponibilidad del cliente (efectivo, Binance, transferencia Bs o promedio).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setRateType('BCV')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  rateType === 'BCV'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs">Dólar BCV</div>
                <div className="text-xs font-mono font-bold mt-0.5">{bcvRate} Bs</div>
              </button>

              <button
                type="button"
                onClick={() => setRateType('BINANCE')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  rateType === 'BINANCE'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs">Binance P2P</div>
                <div className="text-xs font-mono font-bold mt-0.5">{binanceRate} Bs</div>
              </button>

              <button
                type="button"
                onClick={() => setRateType('PROMEDIO')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  rateType === 'PROMEDIO'
                    ? 'bg-yellow-600/20 border-yellow-500 text-yellow-300 font-bold ring-1 ring-yellow-400/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs">★ Promedio</div>
                <div className="text-xs font-mono font-bold mt-0.5">{avgRate} Bs</div>
              </button>

              <button
                type="button"
                onClick={() => setRateType('EURO')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  rateType === 'EURO'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs">Euro BCV</div>
                <div className="text-xs font-mono font-bold mt-0.5">{eurRate} Bs</div>
              </button>

              <button
                type="button"
                onClick={() => setRateType('EFECTIVO')}
                className={`p-2.5 rounded-xl border text-center transition ${
                  rateType === 'EFECTIVO'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs">$ Efectivo</div>
                <div className="text-xs font-mono font-bold mt-0.5">Valor Facial</div>
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Items / Conceptos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              4. Conceptos y Renglones de Facturación
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold text-xs rounded-lg flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Renglón
            </button>
          </div>

          <div className="space-y-2.5">
            {items.map((it, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                {/* Selector de Categoría / Línea de Negocio */}
                <select
                  value={it.category || 'MARKETING_RRSS'}
                  onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-orange-300 rounded-lg px-2 py-1.5 font-medium outline-none sm:w-48 focus:border-orange-500"
                  title="Categoría de servicio para reportes y gráficos"
                >
                  {SERVICE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                      {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  required
                  placeholder="Descripción del servicio (ej. Manejo de redes, Meta Ads, Grabación, Rotulado...)"
                  value={it.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-100 outline-none px-2 py-1"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Unidad"
                    value={it.unit || '1.0'}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-16 bg-slate-900 text-center text-xs font-mono text-slate-300 rounded px-1.5 py-1.5 border border-slate-800"
                  />

                  <input
                    type="number"
                    min="1"
                    value={it.quantity || 1}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-14 bg-slate-900 text-center text-xs font-mono text-slate-300 rounded px-1.5 py-1.5 border border-slate-800"
                  />

                  <div className="w-24 relative">
                    <span className="absolute left-2 top-1.5 text-xs text-slate-500 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Monto $"
                      value={it.amount}
                      onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 text-right text-xs font-mono font-bold text-emerald-400 rounded pl-5 pr-2 py-1.5 border border-slate-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-slate-500 hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Summary Box */}
          <div className="bg-slate-950 border border-orange-500/30 rounded-2xl p-5 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Liquidacion en Bolivares */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block mb-1">
                  Liquidación de la Factura / Recibo
                </span>
                <div className="flex justify-between text-slate-400">
                  <span>Total en Divisa ($):</span>
                  <span className="font-mono font-bold text-emerald-400">${totalAmountCurrency.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tasa Aplicada ({rateType}):</span>
                  <span className="font-mono text-amber-300">{effectiveRate} Bs/$</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal en Bs:</span>
                  <span className="font-mono">Bs. {formatBs(subtotalBs)}</span>
                </div>
                {docType === 'FORMA_LIBRE' && (
                  <div className="flex justify-between text-slate-300">
                    <span>IVA (16%):</span>
                    <span className="font-mono">Bs. {formatBs(ivaAmountBs)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-100 border-t border-slate-800 pt-1.5">
                  <span>Total a Pagar:</span>
                  <span className="font-mono text-orange-400 text-base">Bs. {formatBs(totalBs)}</span>
                </div>
              </div>

              {/* Right: UNIDAD BASE BCV PATRON OFICIAL */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-bold text-[11px] mb-1">
                  <span>★ Unidad Base Oficial BCV</span>
                  <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-mono">
                    Tasa: {bcvRate} Bs
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Este es el valor monetario real homogéneo para comparar con otros meses sin distorsión cambiaria:
                </p>
                <div className="pt-2">
                  <div className="text-lg font-black font-mono text-white">
                    ${baseUsdBcv.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">USD Oficial</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Bs. {formatBs(baseBsBcv)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Estado de Pago / Validez */}
        {docType === 'PRESUPUESTO' ? (
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl flex-shrink-0">
                ⏳
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Vigencia de la Propuesta Comercial
                </h4>
                <p className="text-xs text-slate-300">
                  El presupuesto se generará como propuesta activa válida por <strong>3 días hábiles</strong> tras su emisión.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block">
                ⚡ Válido por 3 días hábiles
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200">¿Registrar como Pagado Inmediatamente?</label>
                <p className="text-xs text-slate-400">Si el cliente ya transfirió o pagó en efectivo, márcalo como pagado.</p>
              </div>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
              />
            </div>

            {isPaid && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                  >
                    <option value="TRANSFERENCIA_BS">Transferencia Mercantil (Bs)</option>
                    <option value="PAGO_MOVIL">Pago Móvil</option>
                    <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                    <option value="BINANCE_USDT">Binance Pay (USDT)</option>
                    <option value="ZELLE">Zelle</option>
                    <option value="PAYPAL">PayPal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">N.º de Referencia Bancaria</label>
                  <input
                    type="text"
                    placeholder="Ej. Ref #123456"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Generando...' : (
              docType === 'PRESUPUESTO' ? '🚀 Generar Presupuesto Online & Crear Enlace Público' :
              docType === 'FORMA_LIBRE' ? '🖨️ Emitir e Imprimir Forma Libre' : '📄 Emitir Recibo Digital'
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
