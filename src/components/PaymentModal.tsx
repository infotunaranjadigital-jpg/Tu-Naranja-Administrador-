'use client';

import React, { useState } from 'react';
import { CheckCircle, X, DollarSign, CreditCard, Building2, Calendar, Hash } from 'lucide-react';

interface PaymentModalProps {
  document: any;
  bcvRate: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  document: doc,
  bcvRate,
  isOpen,
  onClose,
  onPaymentSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA_BS');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  if (!isOpen || !doc) return null;

  const totalUsd = Number(doc.total_amount_currency) || 0;
  const totalBs = Number(doc.total_bs_applied) || (totalUsd * bcvRate);
  const formatBs = (n: number) => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'PAID',
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          paid_at: `${paymentDate}T12:00:00Z`
        })
      });

      if (res.ok) {
        onPaymentSuccess();
        onClose();
      } else {
        alert('Error al registrar el cobro en el sistema.');
      }
    } catch {
      alert('Error de conexión al guardar el cobro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-sm">
                Registrar Cobro / Marcar como Pagado
              </h3>
              <p className="text-[11px] text-slate-400">
                {doc.doc_type === 'FORMA_LIBRE' ? `Factura Fiscal #${doc.doc_number}` : `Recibo Digital #${doc.doc_number}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {/* Card Resumen del Cliente y Monto */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-semibold mb-1">Cliente:</div>
            <div className="font-bold text-slate-100 text-base">{doc.client_name}</div>
            
            <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total a Cobrar</span>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  ${totalUsd.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">USD</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Monto en Bolívares</span>
                <div className="text-sm font-bold text-slate-200 font-mono">
                  Bs. {formatBs(totalBs)}
                </div>
              </div>
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-orange-400" />
              Método de Pago Recibido
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-orange-500 transition"
            >
              <option value="TRANSFERENCIA_BS">💸 Transferencia Mercantil (Bs)</option>
              <option value="PAGO_MOVIL">📱 Pago Móvil (Bs)</option>
              <option value="EFECTIVO_USD">💵 Efectivo ($ USD)</option>
              <option value="BINANCE_USDT">🟡 Binance Pay (USDT)</option>
              <option value="ZELLE">🏦 Zelle (USD)</option>
              <option value="PAYPAL">💳 PayPal (USD)</option>
              <option value="INTERCAMBIO">📦 Intercambio / Mercancía</option>
            </select>
          </div>

          {/* Nro de Referencia / Comprobante */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-orange-400" />
              N.º de Referencia / Comprobante / Nota
            </label>
            <input
              type="text"
              placeholder="Ej. Ref #987654 / Banesco / En sobre"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none font-mono focus:border-orange-500 transition"
            />
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Fecha de Recepción del Pago
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-orange-500 transition"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Confirmar Cobro Recibido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
