'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Settings2, Eye, EyeOff, ArrowLeft, Download, CheckCircle } from 'lucide-react';

interface FormaLibrePrintProps {
  document: any;
  onBack: () => void;
  onMarkPaid?: () => void;
}

export default function FormaLibrePrint({ document: doc, onBack, onMarkPaid }: FormaLibrePrintProps) {
  // Offsets en milimetros para calibracion fina
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  useEffect(() => {
    const savedX = localStorage.getItem('forma_libre_offset_x');
    const savedY = localStorage.getItem('forma_libre_offset_y');
    if (savedX) setOffsetX(parseFloat(savedX));
    if (savedY) setOffsetY(parseFloat(savedY));
  }, []);

  const handleSaveOffsets = () => {
    localStorage.setItem('forma_libre_offset_x', offsetX.toString());
    localStorage.setItem('forma_libre_offset_y', offsetY.toString());
    alert('Calibración guardada en tu navegador.');
  };

  const handlePrint = () => {
    window.print();
  };

  let items = [];
  try {
    items = typeof doc.items_json === 'string' ? JSON.parse(doc.items_json) : (doc.items_json || []);
  } catch {
    items = [];
  }

  // Formatting helpers
  const formatBs = (num: number) => {
    return (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 text-slate-100">
      {/* Top Controls - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
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
              🖨️ Impresión en Forma Libre (Factura Nº {doc.doc_number?.toString().padStart(6, '0')})
            </h2>
            <p className="text-xs text-slate-400">
              Modo superposición milimétrica para imprimir sobre papel talonario fiscal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Calibrador modal trigger / inputs */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Settings2 className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400">Ajuste X:</span>
            <input
              type="number"
              value={offsetX}
              onChange={(e) => setOffsetX(parseFloat(e.target.value) || 0)}
              className="w-12 bg-slate-900 text-center font-mono rounded px-1 text-slate-200 outline-none border border-slate-700"
            />
            <span className="text-slate-500">mm</span>
            <span className="text-slate-400 ml-1">Y:</span>
            <input
              type="number"
              value={offsetY}
              onChange={(e) => setOffsetY(parseFloat(e.target.value) || 0)}
              className="w-12 bg-slate-900 text-center font-mono rounded px-1 text-slate-200 outline-none border border-slate-700"
            />
            <span className="text-slate-500">mm</span>
            <button
              onClick={handleSaveOffsets}
              className="ml-1 text-[11px] text-orange-400 hover:underline"
            >
              Guardar
            </button>
          </div>

          {doc.payment_status === 'PAID' ? (
            <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Cobrado</span>
            </div>
          ) : (
            onMarkPaid && (
              <button
                onClick={onMarkPaid}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Registrar Cobro</span>
              </button>
            )
          )}

          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              showGuide ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Muestra un fondo simulado para verificar alineación"
          >
            {showGuide ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showGuide ? 'Ocultar Guía' : 'Ver Guía de Casillas'}
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir Encima del Papel
          </button>
        </div>
      </div>

      {/* Printable Sheet (Letter Size: 216mm x 279mm) */}
      <div className="max-w-[216mm] mx-auto bg-white text-black shadow-2xl rounded-sm print:shadow-none print:m-0 print:p-0 relative overflow-hidden">
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
              size: letter;
              margin: 0;
            }
          }
        `}</style>

        <div
          className="relative w-[216mm] min-h-[279mm] p-[15mm] text-[12px] font-sans"
          style={{
            transform: `translate(${offsetX}mm, ${offsetY}mm)`,
            backgroundColor: showGuide ? '#fffdf7' : 'transparent',
            border: showGuide ? '1px dashed #cbd5e1' : 'none'
          }}
        >
          {/* Guía visual decorativa si está activada */}
          {showGuide && (
            <div className="absolute inset-x-8 top-8 text-center text-red-400 text-[10px] font-mono border border-dashed border-red-300 p-1 mb-2">
              [VISTA DE CALIBRACIÓN: ESTA GUÍA NO SE IMPRIMIRÁ EN EL PAPEL]
            </div>
          )}

          {/* Fila 1: Fecha de emisión (alineada a la derecha) */}
          <div className="flex justify-end pt-4 pr-6 mb-2">
            <div className="font-semibold text-right">
              <span className="text-gray-600 mr-2">Fecha De Emisión:</span>
              <span className="font-mono font-bold text-[13px]">{doc.issue_date}</span>
            </div>
          </div>

          {/* Fila 2: Cabecera Cliente */}
          <div className="grid grid-cols-12 gap-2 mb-1.5 pt-2">
            <div className="col-span-6">
              <span className="font-bold mr-1">Razón Social:</span>
              <span className="font-medium uppercase">{doc.client_business_name || doc.client_name}</span>
            </div>
            <div className="col-span-3">
              <span className="font-bold mr-1">RIF / CI:</span>
              <span className="font-mono font-bold">{doc.client_rif || 'No especificado'}</span>
            </div>
            <div className="col-span-3 text-right">
              <span className="font-bold mr-1">Telf:</span>
              <span>{doc.client_phone || '0414-1544252'}</span>
            </div>
          </div>

          {/* Fila 3: Dirección Fiscal & Factura Nº */}
          <div className="flex justify-between items-start mb-6 pb-2">
            <div className="w-3/4">
              <span className="font-bold mr-1">Dirección Fiscal:</span>
              <span className="text-[11px] leading-tight text-gray-800">{doc.client_address || 'Caracas, Venezuela'}</span>
            </div>
            <div className="w-1/4 text-right">
              <span className="font-black text-sm tracking-wider">
                FACTURA Nº {doc.doc_number?.toString().padStart(6, '0')}
              </span>
            </div>
          </div>

          {/* Fila 5: Tabla de Ítems */}
          <div className="min-h-[110mm]">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-black/80 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 w-7/12">Descripción</th>
                  <th className="py-2 text-center w-1/12">Unidad</th>
                  <th className="py-2 text-center w-1/12">Cant.</th>
                  <th className="py-2 text-right w-1.5/12">Precio Unitario</th>
                  <th className="py-2 text-right w-1.5/12">Importe Bs.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item: any, idx: number) => {
                  const qty = Number(item.quantity) || 1;
                  const unitPriceBs = Number(item.unitPrice) || (doc.currency === 'USD' ? (Number(item.amount) * doc.applied_rate) : Number(item.amount));
                  const amountBs = Number(item.amount) ? (doc.currency === 'USD' ? (Number(item.amount) * doc.applied_rate) : Number(item.amount)) : (qty * unitPriceBs);

                  return (
                    <tr key={idx} className="align-top">
                      <td className="py-2 pr-2 font-medium">
                        {item.description}
                      </td>
                      <td className="py-2 text-center font-mono">
                        {item.unit || '1.0'}
                      </td>
                      <td className="py-2 text-center font-mono">
                        {qty}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatBs(unitPriceBs)}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold">
                        {formatBs(amountBs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Datos Bancarios Mercantil */}
          <div className="text-[10px] text-gray-700 mb-6 pt-4 border-t border-gray-300">
            <p className="font-semibold">
              Para emitir transferencia por favor hacer a la cuenta corriente 0105-0638-70-163832743-2
            </p>
            <p>Banco Mercantil. Gracias. Telf 0414-154 42 52</p>
          </div>

          {/* Fila 15-17: Totales */}
          <div className="flex justify-between items-start mb-6">
            {/* Formas de Pago */}
            <div className="w-1/2 text-[10px] space-y-1 font-semibold text-gray-700">
              <p className="font-bold underline mb-1">FORMA DE PAGO</p>
              <p>EFECTIVO: {doc.payment_method?.includes('EFECTIVO') ? '✓ SÍ' : '____________________'}</p>
              <p>TRANSFERENCIA: {doc.payment_method?.includes('TRANSFERENCIA') || doc.payment_method?.includes('PAGO_MOVIL') ? '✓ ' + (doc.payment_reference || 'Confirmado') : '____________________'}</p>
              <p>BANCO: Mercantil</p>
            </div>

            {/* Subtotal, IVA 16%, Total */}
            <div className="w-1/2 text-right space-y-1.5 font-mono">
              <div className="flex justify-between text-[11px]">
                <span className="font-sans font-bold text-gray-700">Sub - Total (Bs.):</span>
                <span>{formatBs(doc.subtotal_bs)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="font-sans font-bold text-gray-700">IVA (16%):</span>
                <span>{formatBs(doc.iva_amount_bs)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-black border-t-2 border-black pt-1">
                <span className="font-sans">TOTAL A PAGAR (Bs.):</span>
                <span>{formatBs(doc.total_bs_applied)}</span>
              </div>
              {doc.currency === 'USD' && (
                <div className="text-[10px] font-sans text-gray-500 pt-0.5">
                  Ref: ${(doc.total_amount_currency || 0).toFixed(2)} USD a tasa {doc.rate_type_applied} ({doc.applied_rate} Bs/$)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
