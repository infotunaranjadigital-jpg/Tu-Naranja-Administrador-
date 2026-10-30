'use client';

import React, { useState } from 'react';
import { 
  Printer, MessageCircle, Copy, CheckCircle, 
  Clock, AlertTriangle, Calendar, ShieldCheck, 
  ExternalLink, ArrowLeft, Download, DollarSign,
  Building, Phone, Mail, MapPin, Sparkles
} from 'lucide-react';

interface PresupuestoCardProps {
  document: any;
  isAdmin?: boolean;
  onBack?: () => void;
  onConvertToInvoice?: () => void;
}

export default function PresupuestoCard({
  document: doc,
  isAdmin = false,
  onBack,
  onConvertToInvoice
}: PresupuestoCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  let items: any[] = [];
  try {
    items = typeof doc.items_json === 'string' ? JSON.parse(doc.items_json) : (doc.items_json || []);
  } catch {
    items = [];
  }

  const formatBs = (num: number) => {
    return (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatUsd = (num: number) => {
    return (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  // Determinar si está vigente o vencido
  const today = new Date().toISOString().split('T')[0];
  const isExpired = doc.due_date ? today > doc.due_date : false;

  // Formato legible de fecha
  const formatDateFriendly = (dStr: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Base URL para enlace público
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/presupuesto/${doc.id}`
    : `https://admin.tunaranjadigital.com/presupuesto/${doc.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const docNum = doc.doc_number?.toString().padStart(4, '0') || '0101';
    const msg = `¡Hola ${doc.client_name || ''}! Te compartimos el *Presupuesto Oficial N.º PP-${docNum}* de *Tu Naranja Digital*:

📄 *Monto Total:* $${formatUsd(doc.total_amount_currency)} USD (Ref: Bs. ${formatBs(doc.total_bs_applied)} a tasa oficial BCV)
⏳ *Validez:* Válido por 3 días hábiles (hasta el ${formatDateFriendly(doc.due_date)})

Puedes revisarlo en línea y descargarlo en PDF en este enlace:
${publicUrl}

¡Quedamos atentos a cualquier duda o para iniciar con todo!`;

    navigator.clipboard.writeText(msg);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);

    const clientPhoneClean = (doc.client_phone || '').replace(/[^0-9]/g, '');
    if (clientPhoneClean) {
      window.open(`https://api.whatsapp.com/send?phone=${clientPhoneClean}&text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleClientAcceptWhatsApp = () => {
    const docNum = doc.doc_number?.toString().padStart(4, '0') || '0101';
    const msg = `¡Hola equipo de Tu Naranja Digital! He revisado el *Presupuesto N.º PP-${docNum}* por un total de *$${formatUsd(doc.total_amount_currency)} USD* y deseo *APROBARLO* para coordinar el inicio de los servicios.`;
    window.open(`https://api.whatsapp.com/send?phone=584141544252&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const docNumFormatted = `PP-${(doc.doc_number || 101).toString().padStart(4, '0')}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8">
      {/* Action Bar (No se imprime) */}
      <div className="max-w-4xl mx-auto mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          {isAdmin && onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
                Presupuesto Online
              </span>
              <h2 className="font-mono font-bold text-white text-sm sm:text-base">
                N.º {docNumFormatted}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Enlace público activo para compartir con el cliente.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            title="Copiar enlace público web"
          >
            {copiedLink ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>

          {/* Share via WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{copiedText ? '¡Mensaje Copiado!' : 'Enviar por WhatsApp'}</span>
          </button>

          {/* Download PDF / Print */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar en PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Sheet / Document Container */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:m-0 print:p-0 print:rounded-none">
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
              margin: 12mm 15mm;
            }
          }
        `}</style>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl shadow-lg">
                🍊
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>Tu Naranja Digital</span>
                </h1>
                <p className="text-xs text-orange-100 font-medium">
                  Agencia de Marketing Digital, Soluciones Web & Producción Audiovisual
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-orange-200 mt-1">
                  <span className="flex items-center gap-1">📍 Caracas, Venezuela</span>
                  <span className="flex items-center gap-1">📞 +58 414 154 42 52</span>
                  <span className="flex items-center gap-1">✉️ info@tunaranjadigital.com</span>
                </div>
              </div>
            </div>

            {/* Presupuesto Badge */}
            <div className="text-left sm:text-right bg-black/20 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider block">
                Presupuesto Comercial
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-white">
                N.º {docNumFormatted}
              </div>
              <div className="text-xs text-orange-100 mt-0.5">
                Emisión: <strong>{formatDateFriendly(doc.issue_date)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Validity Banner (Callout de 3 días hábiles) */}
        <div className={`p-4 border-b text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isExpired 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-amber-50/90 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
              isExpired ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-900'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <span>{isExpired ? '⚠️ Presupuesto Vencido' : '⚡ Validez de la Oferta: 3 Días Hábiles'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                  isExpired ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {isExpired ? 'Expirado' : 'Vigente'}
                </span>
              </div>
              <p className="text-[11px] opacity-90 mt-0.5">
                {isExpired
                  ? `Este presupuesto venció el ${formatDateFriendly(doc.due_date)}. Contáctanos para actualizar la tasa y disponibilidad.`
                  : `Válido hasta el ${formatDateFriendly(doc.due_date)}. Los montos se liquidan a tasa oficial BCV del día del pago.`}
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono font-semibold bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm flex-shrink-0">
            <span>Vence: </span>
            <strong className={isExpired ? 'text-rose-600' : 'text-amber-800'}>
              {formatDateFriendly(doc.due_date)}
            </strong>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Client & Proposal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                📋 Propuesta Presentada a:
              </span>
              <div className="text-base font-bold text-slate-900 uppercase">
                {doc.client_business_name || doc.client_name}
              </div>
              {doc.client_name && doc.client_business_name && doc.client_name !== doc.client_business_name && (
                <div className="text-slate-600 font-medium mt-0.5">
                  Atención: {doc.client_name}
                </div>
              )}
              <div className="mt-2 space-y-1 text-slate-600">
                {doc.client_rif && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">RIF / C.I.:</span>
                    <span className="font-mono">{doc.client_rif}</span>
                  </div>
                )}
                {doc.client_phone && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Teléfono:</span>
                    <span>{doc.client_phone}</span>
                  </div>
                )}
                {doc.client_email && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Email:</span>
                    <span>{doc.client_email}</span>
                  </div>
                )}
                {doc.client_address && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Ubicación:</span>
                    <span>{doc.client_address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-6 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                📊 Parámetros de Liquidación:
              </span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Moneda Base:</span>
                <span className="font-bold text-slate-900">Dólares Americanos (USD)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Tasa Referencial Aplicada:</span>
                <span className="font-mono font-bold text-orange-600">
                  {doc.applied_rate ? `${doc.applied_rate.toFixed(2)} Bs/$ (${doc.rate_type_applied || 'BCV'})` : 'Oficial BCV'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Tiempo de Validez:</span>
                <span className="font-semibold text-slate-800">3 Días Hábiles</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Estado de Aprobación:</span>
                <span className="font-bold text-amber-700">Pendiente de Confirmación</span>
              </div>
            </div>
          </div>

          {/* Items & Services Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>📦</span>
                <span>Alcance y Servicios Propuestos</span>
              </h3>
              <span className="text-[10px] text-slate-500">
                {items.length} {items.length === 1 ? 'servicio cotizado' : 'servicios cotizados'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Descripción del Servicio / Entregable</th>
                    <th className="py-3 px-3 text-center w-20">Cant.</th>
                    <th className="py-3 px-4 text-right w-28">Precio USD</th>
                    <th className="py-3 px-4 text-right w-36">Total Bs. (BCV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it: any, idx: number) => {
                    const itAmount = Number(it.amount) || 0;
                    const itBs = itAmount * (doc.applied_rate || 888.12);
                    const qty = Number(it.quantity) || 1;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {it.description}
                          </div>
                          {it.category && (
                            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {it.category.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-700">
                          {qty}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          ${formatUsd(itAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-orange-600">
                          Bs. {formatBs(itBs)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Payment Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            {/* Payment & Terms Section */}
            <div className="md:col-span-7 space-y-4">
              {/* Payment Accounts */}
              <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-4 text-xs text-slate-700">
                <p className="font-bold text-orange-950 mb-2 flex items-center gap-1.5 text-xs">
                  <span>🏦</span>
                  <span>Cuentas para Pago / Liquidación:</span>
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-900">Banco Mercantil (Cta. Corriente):</span>
                    <p className="font-mono font-bold text-slate-900 text-xs select-all">0105-0638-70-163832743-2</p>
                    <p className="text-[10px] text-slate-600">A nombre de: Tu Naranja Digital</p>
                  </div>
                  <div className="pt-1 border-t border-orange-200/60 flex items-center justify-between">
                    <span><strong>Pago Móvil:</strong> Banco Mercantil • Tel: <strong>0414-154 42 52</strong></span>
                  </div>
                  <div className="pt-1 border-t border-orange-200/60 flex items-center justify-between text-[10px] text-slate-600">
                    <span>Disponibles también: <strong>Binance USDT</strong>, <strong>Efectivo USD</strong> y <strong>Zelle</strong>.</span>
                  </div>
                </div>
              </div>

              {/* Terms and conditions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 space-y-1.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  📜 Términos y Condiciones Comerciales:
                </span>
                <p>
                  • <strong>Validez:</strong> Este presupuesto es válido por exactamente <strong>3 días hábiles</strong> posteriores a su fecha de emisión.
                </p>
                <p>
                  • <strong>Tasa de Cambio:</strong> Los importes en Bolívares se calculan a la tasa oficial del Banco Central de Venezuela (BCV) del día en que se efectúe la transferencia.
                </p>
                <p>
                  • <strong>Arranque del Proyecto:</strong> La fecha de inicio de actividades y reserva de agenda de trabajo se activan tras la confirmación de la orden y recepción del abono inicial.
                </p>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="md:col-span-5 bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Subtotal en Divisas:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${formatUsd(doc.total_amount_currency)} USD
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Tasa BCV del Día:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {doc.applied_rate ? `${doc.applied_rate.toFixed(2)} Bs/$` : 'Oficial'}
                </span>
              </div>

              <div className="pt-3 border-t-2 border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Monto Total Presupuestado:
                </span>
                <div className="flex flex-col gap-1">
                  <div className="text-2xl font-black font-mono text-orange-600 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-700">Total USD:</span>
                    <span>${formatUsd(doc.total_amount_currency)}</span>
                  </div>
                  <div className="text-base font-black font-mono text-slate-900 flex items-baseline justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-xs font-bold text-slate-600">En Bolívares:</span>
                    <span>Bs. {formatBs(doc.total_bs_applied)}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Client CTA (Solo visible en versión web) */}
              <div className="pt-3 print:hidden">
                <button
                  type="button"
                  onClick={handleClientAcceptWhatsApp}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Aprobar Presupuesto por WhatsApp</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-1.5">
                  Respuesta inmediata de nuestro equipo de atención.
                </p>
              </div>
            </div>
          </div>

          {/* Notes if provided */}
          {doc.notes && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">Notas y Observaciones Adicionales:</span>
              <p className="whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans">
                {doc.notes}
              </p>
            </div>
          )}

          {/* Signatures / Footer */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-800">🍊 Tu Naranja Digital</p>
              <p className="text-[10px]">Creatividad, Estrategia y Rendimiento en Medios Digitales</p>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Documento generado digitalmente • ID: {doc.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
