'use client';

import React, { useState } from 'react';
import { Printer, ArrowLeft, MessageCircle, CheckCircle, Copy } from 'lucide-react';

interface ReceiptPrintProps {
  document: any;
  onBack: () => void;
  onMarkPaid?: () => void;
}

export default function ReceiptPrint({ document: doc, onBack, onMarkPaid }: ReceiptPrintProps) {
  const [copied, setCopied] = useState(false);

  let items = [];
  try {
    items = typeof doc.items_json === 'string' ? JSON.parse(doc.items_json) : (doc.items_json || []);
  } catch {
    items = [];
  }

  const formatBs = (num: number) => {
    return (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const lines = items.map((it: any) => `• ${it.description}: Bs. ${formatBs(it.amount * (doc.currency === 'USD' ? doc.applied_rate : 1))}`).join('\n');
    const msg = `Hola ${doc.client_name}, te adjuntamos el *Recibo Digital N.º ${doc.doc_number}* de *Tu Naranja Digital* correspondiente a ${doc.issue_date}:

${lines}

*Total a Pagar:* Bs. ${formatBs(doc.total_bs_applied)} (Ref: $${doc.total_amount_currency} a tasa ${doc.rate_type_applied} de ${doc.applied_rate} Bs)

*Datos de Transferencia / Pago Móvil:*
Banco Mercantil - Cta Corriente
0105-0638-70-163832743-2
Teléfono: 0414-154 42 52

¡Muchas gracias!`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    const clientPhoneClean = (doc.client_phone || '').replace(/[^0-9]/g, '');
    if (clientPhoneClean) {
      window.open(`https://api.whatsapp.com/send?phone=${clientPhoneClean}&text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 text-slate-100">
      {/* Top Controls */}
      <div className="max-w-3xl mx-auto mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div>
            <h2 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
              📄 Recibo Digital N.º {doc.doc_number}
            </h2>
            <p className="text-xs text-slate-400">
              Comprobante administrativo oficial de Tu Naranja Digital.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateWhatsAppMessage}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <MessageCircle className="w-4 h-4" />
            {copied ? '¡Copiado!' : 'Enviar por WhatsApp'}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Descargar PDF
          </button>
        </div>
      </div>

      {/* Styled Printable Receipt */}
      <div className="max-w-2xl mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl p-8 sm:p-12 print:shadow-none print:m-0 print:p-6 print:rounded-none relative">
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            @page {
              size: letter portrait;
              margin: 15mm;
            }
          }
        `}</style>

        {/* Header Tu Naranja Digital */}
        <div className="flex justify-between items-start border-b-2 border-orange-500 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black text-orange-600 tracking-tight">🍊 Tu Naranja Digital</span>
            </div>
            <p className="text-xs text-slate-500">Agencia de Marketing y Soluciones Digitales</p>
            <p className="text-xs text-slate-500">Caracas, Venezuela, 1010</p>
            <p className="text-xs text-slate-600 font-semibold mt-1">Teléfono: +58 414 154 42 52</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              Recibo Digital
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              N.º {doc.doc_number?.toString().padStart(4, '0')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">Fecha:</span> {doc.issue_date}
            </div>
          </div>
        </div>

        {/* Customer Details Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Nota de Entrega / Recibo a:</p>
          <div className="font-bold text-sm text-slate-900 uppercase">
            {doc.client_business_name || doc.client_name}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">RIF / C.I.:</span> {doc.client_rif || 'N/A'}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Teléfono:</span> {doc.client_phone || 'N/A'}
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-700">Dirección:</span> {doc.client_address || 'Caracas, Venezuela'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 min-h-[140px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5">Descripción del artículo o servicio</th>
                <th className="py-2.5 text-right w-36">Importe Bs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item: any, idx: number) => {
                const amountBs = Number(item.amount) ? (doc.currency === 'USD' ? (Number(item.amount) * doc.applied_rate) : Number(item.amount)) : 0;
                return (
                  <tr key={idx}>
                    <td className="py-3 font-medium text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-900">
                      Bs. {formatBs(amountBs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown & Bank Info */}
        <div className="grid grid-cols-12 gap-6 border-t-2 border-slate-200 pt-6 items-start">
          {/* Bank Instructions */}
          <div className="col-span-7 bg-orange-50/60 border border-orange-200/60 rounded-xl p-3.5 text-[11px] text-slate-700">
            <p className="font-bold text-orange-950 mb-1 flex items-center gap-1">
              🏦 Datos de Pago / Transferencia:
            </p>
            <p className="font-semibold">Banco Mercantil (Cuenta Corriente)</p>
            <p className="font-mono text-slate-800 font-bold text-xs select-all">0105-0638-70-163832743-2</p>
            <p className="text-[10px] text-slate-600 mt-1">A nombre de: Tu Naranja Digital</p>
            <p className="text-[10px] text-slate-600">Pago Móvil: 0414-1544252</p>
          </div>

          {/* Subtotal and Total */}
          <div className="col-span-5 space-y-2 text-right">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">Bs. {formatBs(doc.subtotal_bs)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Tasa Liquidada ({doc.rate_type_applied}):</span>
              <span className="font-mono font-bold text-orange-600">{doc.applied_rate} Bs/$</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
              <span>Total a Pagar:</span>
              <span className="font-mono text-orange-600">Bs. {formatBs(doc.total_bs_applied)}</span>
            </div>
            {doc.currency === 'USD' && (
              <div className="text-[11px] font-bold text-slate-500">
                (Equivalente: ${doc.total_amount_currency.toFixed(2)} USD)
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
          Documento digital emitido con fines administrativos y comerciales de Tu Naranja Digital.
        </div>
      </div>
    </div>
  );
}
