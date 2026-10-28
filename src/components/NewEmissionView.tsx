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

export default function NewEmissionView({
  clients,
  rates,
  initialClient,
  onEmissionSuccess
}: NewEmissionProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClient?.id || (clients[0]?.id || ''));
  const [docType, setDocType] = useState<'FORMA_LIBRE' | 'RECIBO'>('RECIBO');
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

  // Items
  const [items, setItems] = useState<any[]>([
    { description: 'Manejo de Redes Sociales', unit: '1.0', quantity: 1, amount: 150.0 }
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
          unit: '1.0',
          quantity: 1,
          amount: client.base_monthly_fee
        });
      }
      if (client.meta_ads_budget > 0) {
        newItems.push({
          description: `Pauta Publicitaria Meta ADS`,
          unit: '1.0',
          quantity: 1,
          amount: client.meta_ads_budget
        });
      }
      if (newItems.length > 0) {
        setItems(newItems);
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
  else if (rateType === 'EFECTIVO') effectiveRate = bcvRate;
  else if (rateType === 'CUSTOM') effectiveRate = parseFloat(customRate) || bcvRate;

  // Calculos
  const totalAmountCurrency = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const subtotalBs = currency === 'USD' ? totalAmountCurrency * effectiveRate : totalAmountCurrency;
  const ivaRate = docType === 'FORMA_LIBRE' ? 0.16 : 0.0;
  const ivaAmountBs = subtotalBs * ivaRate;
  const totalBs = subtotalBs + ivaAmountBs;

  // Unidad Base BCV
  const baseBsBcv = currency === 'USD' ? totalAmountCurrency * bcvRate * (1 + ivaRate) : totalBs;
  const baseUsdBcv = baseBsBcv / bcvRate;

  const handleAddItem = () => {
    setItems([...items, { description: '', unit: '1.0', quantity: 1, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
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
          client_id: selectedClientId,
          client_rif: selectedRif || selectedClient?.rif,
          issue_date: issueDate,
          due_date: dueDate,
          currency,
          total_amount_currency: totalAmountCurrency,
          rate_type_applied: rateType,
          custom_rate: rateType === 'CUSTOM' ? effectiveRate : undefined,
          items,
          notes,
          is_paid: isPaid,
          payment_method: isPaid ? paymentMethod : null,
          payment_reference: isPaid ? paymentReference : null
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
        {/* Step 1: Client Selector & Doc Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                1. Seleccionar Cliente *
              </label>
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
            </div>

            {/* Document Type (Forma libre vs Recibo) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                2. Tipo de Documento a Emitir
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('FORMA_LIBRE')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    docType === 'FORMA_LIBRE'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    🖨️ Factura Forma Libre
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Superposición exacta sobre papel continuo SENIAT (+16% IVA)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType('RECIBO')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    docType === 'RECIBO'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-200 shadow-md shadow-orange-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    📄 Recibo Digital
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Comprobante administrativo membretado Tu Naranja Digital
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
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>
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
              <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="Descripción del servicio (ej. Manejo de redes, Meta Ads, Grabación...)"
                  value={it.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="w-7/12 bg-transparent text-xs text-slate-100 outline-none px-2 py-1"
                />

                <input
                  type="text"
                  placeholder="Unidad"
                  value={it.unit || '1.0'}
                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                  className="w-1.5/12 bg-slate-900 text-center text-xs font-mono text-slate-300 rounded px-1.5 py-1 border border-slate-800"
                />

                <input
                  type="number"
                  min="1"
                  value={it.quantity || 1}
                  onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                  className="w-1.5/12 bg-slate-900 text-center text-xs font-mono text-slate-300 rounded px-1.5 py-1 border border-slate-800"
                />

                <div className="w-2/12 relative">
                  <span className="absolute left-2 top-1.5 text-xs text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Monto $"
                    value={it.amount}
                    onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-right text-xs font-mono font-bold text-emerald-400 rounded pl-5 pr-2 py-1 border border-slate-800"
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

        {/* Step 4: Estado de Pago */}
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

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Generando...' : (
              docType === 'FORMA_LIBRE' ? '🖨️ Emitir e Imprimir Forma Libre' : '📄 Emitir Recibo Digital'
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
