'use client';

import React, { useState } from 'react';
import { 
  FileText, Search, Printer, CheckCircle, Clock, 
  MessageCircle, Filter, Eye, DollarSign, X 
} from 'lucide-react';

interface DocumentsViewProps {
  documents: any[];
  onViewDocument: (doc: any) => void;
  onRefreshDocuments: () => void;
}

export default function DocumentsView({
  documents,
  onViewDocument,
  onRefreshDocuments
}: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FORMA_LIBRE' | 'RECIBO' | 'PRESUPUESTO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Modal para registrar pago
  const [payDocModal, setPayDocModal] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA_BS');
  const [reference, setReference] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const filteredDocs = documents.filter(d => {
    const matchesSearch = 
      (d.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.doc_number?.toString().includes(searchTerm);
    const matchesType = typeFilter === 'ALL' || d.doc_type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || d.payment_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenPayModal = (doc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayDocModal(doc);
    setPaymentMethod('TRANSFERENCIA_BS');
    setReference('');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDocModal) return;
    setSavingPayment(true);

    try {
      const res = await fetch(`/api/documents/${payDocModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'PAID',
          payment_method: paymentMethod,
          payment_reference: reference
        })
      });

      if (res.ok) {
        onRefreshDocuments();
        setPayDocModal(null);
      } else {
        alert('Error al registrar pago');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSavingPayment(false);
    }
  };

  const formatBs = (num: number) => (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleCopyPublicLink = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/presupuesto/${docId}`;
    navigator.clipboard.writeText(url);
    setCopiedDocId(docId);
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            Historial de Facturas y Recibos ({documents.length})
          </h2>
          <p className="text-xs text-slate-400">
            Control de emisiones, impresión en formas libres y conciliación de pagos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente o N.º..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 w-52 outline-none"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="PRESUPUESTO">💼 Presupuestos Online (3 Días)</option>
            <option value="FORMA_LIBRE">Facturas Forma Libre</option>
            <option value="RECIBO">Recibos Digitales</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes de Pago</option>
            <option value="PAID">Pagados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-right">Monto Divisa</th>
                <th className="py-3 px-4 text-right">Total Bs.</th>
                <th className="py-3 px-4 text-center">Tasa</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se encontraron documentos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr 
                    key={doc.id}
                    className="hover:bg-slate-850/60 transition cursor-pointer"
                    onClick={() => onViewDocument(doc)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      {doc.doc_type === 'PRESUPUESTO' ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                          <span>💼</span>
                          <span>PP-{(doc.doc_number || 101).toString().padStart(4, '0')}</span>
                        </span>
                      ) : doc.doc_type === 'FORMA_LIBRE' ? (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                          Factura #{doc.doc_number}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
                          Recibo #{doc.doc_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {doc.issue_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{doc.client_business_name || doc.client_name}</div>
                      <div className="text-[10px] text-slate-500">{doc.client_rif || 'Sin RIF'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ${doc.total_amount_currency?.toFixed(2)} USD
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                      Bs. {formatBs(doc.total_bs_applied)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                      <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                        {doc.rate_type_applied} ({doc.applied_rate})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {doc.doc_type === 'PRESUPUESTO' ? (
                        doc.due_date && todayStr > doc.due_date ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full" title={`Venció el ${doc.due_date}`}>
                            <Clock className="w-3 h-3" />
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full" title={`Válido hasta ${doc.due_date}`}>
                            <CheckCircle className="w-3 h-3" />
                            Vigente (3d)
                          </span>
                        )
                      ) : doc.payment_status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {doc.doc_type === 'PRESUPUESTO' ? (
                        <>
                          <button
                            onClick={(e) => handleCopyPublicLink(doc.id, e)}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition shadow"
                            title="Copiar enlace público para el cliente"
                          >
                            {copiedDocId === doc.id ? '¡Copiado!' : '🔗 Enlace'}
                          </button>
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition"
                            title="Ver presupuesto y descargar en PDF"
                          >
                            <Eye className="w-3.5 h-3.5 inline mr-1 text-orange-400" />
                            Ver / PDF
                          </button>
                        </>
                      ) : (
                        <>
                          {doc.payment_status === 'PENDING' && (
                            <button
                              onClick={(e) => handleOpenPayModal(doc, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition shadow"
                              title="Registrar cobro y método de pago"
                            >
                              Cobrar
                            </button>
                          )}

                          <button
                            onClick={() => onViewDocument(doc)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition"
                            title="Ver e imprimir documento"
                          >
                            <Printer className="w-3.5 h-3.5 inline mr-1" />
                            Imprimir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Cobro */}
      {payDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setPayDocModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1">
              Confirmar Cobro ({payDocModal.doc_type === 'FORMA_LIBRE' ? `Factura #${payDocModal.doc_number}` : `Recibo #${payDocModal.doc_number}`})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cliente: <strong className="text-slate-200">{payDocModal.client_name}</strong> | Monto: <strong className="text-emerald-400 font-mono">${payDocModal.total_amount_currency} USD</strong> (Bs. {formatBs(payDocModal.total_bs_applied)})
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Método de Pago Recibido</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                >
                  <option value="TRANSFERENCIA_BS">Transferencia Bancaria Mercantil</option>
                  <option value="PAGO_MOVIL">Pago Móvil Mercantil</option>
                  <option value="EFECTIVO_USD">Efectivo ($ USD)</option>
                  <option value="BINANCE_USDT">Binance Pay (USDT)</option>
                  <option value="ZELLE">Zelle</option>
                  <option value="PAYPAL">PayPal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">N.º de Referencia / Comprobante</label>
                <input
                  type="text"
                  placeholder="Ej. 984512"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayDocModal(null)}
                  className="w-1/2 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="w-1/2 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                >
                  {savingPayment ? 'Registrando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
