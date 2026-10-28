'use client';

import React, { useState } from 'react';
import { 
  Users, Search, Plus, Edit, History, 
  ArrowUpRight, DollarSign, Calendar, FileText, Check, X 
} from 'lucide-react';

interface ClientsViewProps {
  clients: any[];
  onEmitForClient: (client: any) => void;
  onRefreshClients: () => void;
}

export default function ClientsView({
  clients,
  onEmitForClient,
  onRefreshClients
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal para ajuste de tarifa
  const [feeModalClient, setFeeModalClient] = useState<any>(null);
  const [newFee, setNewFee] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [savingFee, setSavingFee] = useState(false);

  // Modal para crear / editar cliente
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    rif: '',
    phone: '',
    email: '',
    address: '',
    base_monthly_fee: '0',
    meta_ads_budget: '0',
    default_rate_type: 'BCV',
    billing_day: '1',
    preferred_document: 'RECIBO',
    notes: ''
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.rif || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenHistory = async (client: any) => {
    setSelectedClientForHistory(client);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`);
      const data = await res.json();
      setHistoryData(data.fee_history || []);
    } catch {
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenFeeModal = (client: any) => {
    setFeeModalClient(client);
    setNewFee(client.base_monthly_fee?.toString() || '0');
    setAdjustmentReason('');
  };

  const handleSaveFeeAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeModalClient) return;
    setSavingFee(true);

    try {
      const res = await fetch(`/api/clients/${feeModalClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_monthly_fee: parseFloat(newFee) || 0,
          fee_adjustment_reason: adjustmentReason || 'Ajuste regular de tarifa'
        })
      });

      if (res.ok) {
        onRefreshClients();
        setFeeModalClient(null);
      }
    } catch (err) {
      alert('Error al ajustar tarifa');
    } finally {
      setSavingFee(false);
    }
  };

  const handleOpenCreateModal = (clientToEdit?: any) => {
    if (clientToEdit) {
      setEditingClient(clientToEdit);
      setFormData({
        name: clientToEdit.name || '',
        business_name: clientToEdit.business_name || '',
        rif: clientToEdit.rif || '',
        phone: clientToEdit.phone || '',
        email: clientToEdit.email || '',
        address: clientToEdit.address || '',
        base_monthly_fee: clientToEdit.base_monthly_fee?.toString() || '0',
        meta_ads_budget: clientToEdit.meta_ads_budget?.toString() || '0',
        default_rate_type: clientToEdit.default_rate_type || 'BCV',
        billing_day: clientToEdit.billing_day?.toString() || '1',
        preferred_document: clientToEdit.preferred_document || 'RECIBO',
        notes: clientToEdit.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        business_name: '',
        rif: '',
        phone: '',
        email: '',
        address: '',
        base_monthly_fee: '0',
        meta_ads_budget: '0',
        default_rate_type: 'BCV',
        billing_day: '1',
        preferred_document: 'RECIBO',
        notes: ''
      });
    }
    setClientModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingClient ? 'PUT' : 'POST';
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          base_monthly_fee: parseFloat(formData.base_monthly_fee) || 0,
          meta_ads_budget: parseFloat(formData.meta_ads_budget) || 0,
          billing_day: parseInt(formData.billing_day, 10) || 1
        })
      });

      if (res.ok) {
        onRefreshClients();
        setClientModalOpen(false);
      } else {
        alert('Error al guardar cliente');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            Directorio de Clientes ({clients.length})
          </h2>
          <p className="text-xs text-slate-400">
            Carga una sola vez los datos fiscales, tarifa, día de cobro y tasa pactada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente, RIF o razón social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 w-64 outline-none"
            />
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-lg relative group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm leading-snug">
                    {client.name}
                  </h3>
                  {client.business_name && client.business_name !== client.name && (
                    <p className="text-xs text-slate-400 font-medium">
                      {client.business_name}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  client.preferred_document === 'FORMA_LIBRE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {client.preferred_document === 'FORMA_LIBRE' ? 'Forma Libre' : 'Recibo'}
                </span>
              </div>

              {/* RIF & Address */}
              <div className="text-xs text-slate-400 space-y-1 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">RIF:</span>
                  <span className="font-mono text-slate-300">{client.rif || 'Sin registrar'}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">Telf:</span>
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Fee & Rate Preferences */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tarifa Base</span>
                  <span className="font-black font-mono text-emerald-400 text-base">
                    ${client.base_monthly_fee} <span className="text-[10px] text-slate-400 font-normal">USD</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Tasa Habitual</span>
                  <span className="font-bold font-mono text-amber-300 text-xs">
                    {client.default_rate_type}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Corte Mensual</span>
                  <span className="font-bold text-slate-300 text-xs">
                    Día {client.billing_day} de cada mes
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Presupuesto Ads</span>
                  <span className="font-mono text-cyan-400 text-xs font-semibold">
                    {client.meta_ads_budget > 0 ? `$${client.meta_ads_budget}` : 'N/A'}
                  </span>
                </div>
              </div>

              {client.last_fee_adjustment_date && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-3">
                  <History className="w-3 h-3 text-slate-400" />
                  Último ajuste: {client.last_fee_adjustment_date}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => handleOpenFeeModal(client)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition font-medium"
                title="Ajustar tarifa y registrar motivo"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Ajustar Tarifa
              </button>

              <button
                onClick={() => handleOpenHistory(client)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                title="Ver historial de cambios de tarifa"
              >
                <History className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleOpenCreateModal(client)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                title="Editar datos del cliente"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onEmitForClient(client)}
                className="ml-auto px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg flex items-center gap-1 transition shadow shadow-orange-600/30"
              >
                Emitir
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajustar Tarifa */}
      {feeModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setFeeModalClient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1">Ajustar Tarifa a {feeModalClient.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tarifa actual: <strong className="text-emerald-400 font-mono">${feeModalClient.base_monthly_fee} USD</strong>
            </p>

            <form onSubmit={handleSaveFeeAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nueva Tarifa Mensual ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo del Ajuste (para auditoría e historial)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej. Ajuste anual 2026, incremento de alcance, cambio de fee..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeeModalClient(null)}
                  className="w-1/2 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFee}
                  className="w-1/2 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                >
                  {savingFee ? 'Guardando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Tarifas */}
      {selectedClientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setSelectedClientForHistory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-400" />
              Historial de Ajustes: {selectedClientForHistory.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Registro histórico de cuándo y por qué se cambió la tarifa.
            </p>

            {loadingHistory ? (
              <p className="text-xs text-slate-400 py-6 text-center">Cargando historial...</p>
            ) : historyData.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No hay registros de cambios de tarifa anteriores.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {historyData.map((h) => (
                  <div key={h.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-emerald-400">
                        ${h.previous_fee} ➔ ${h.new_fee} USD
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{h.date}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{h.reason}</p>
                    <div className="text-[10px] text-slate-500 mt-1">Por: {h.created_by || 'Sistema'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Cliente */}
      {clientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative my-8">
            <button
              onClick={() => setClientModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-1">
              {editingClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Carga los datos una sola vez para que aparezcan en facturas y recibos.
            </p>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Nombre Comercial / Referencial *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    placeholder="Ej. Clínica Leopoldo Aguerrevere"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Razón Social Fiscal (para Facturas)</label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    placeholder="Ej. Materno Infantil C.A (MANTICA)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">RIF / C.I.</label>
                  <input
                    type="text"
                    value={formData.rif}
                    onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                    placeholder="Ej. J-00059876-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    placeholder="Ej. 0212-9072222"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Dirección Fiscal</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                    placeholder="Av. Rio Manapire, Caracas..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tarifa Mensual Base ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_monthly_fee}
                    onChange={(e) => setFormData({ ...formData, base_monthly_fee: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Presupuesto Meta Ads ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.meta_ads_budget}
                    onChange={(e) => setFormData({ ...formData, meta_ads_budget: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono text-cyan-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tasa Habitual de Cálculo</label>
                  <select
                    value={formData.default_rate_type}
                    onChange={(e) => setFormData({ ...formData, default_rate_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-semibold text-amber-300"
                  >
                    <option value="BCV">BCV (Dólar Oficial)</option>
                    <option value="BINANCE">Binance P2P</option>
                    <option value="PROMEDIO">Promedio (BCV + Binance)</option>
                    <option value="EURO">Euro BCV</option>
                    <option value="EFECTIVO">$ Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Día de Cobro Mensual (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.billing_day}
                    onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Documento Preferido</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formData.preferred_document === 'FORMA_LIBRE' ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="preferred_doc"
                        checked={formData.preferred_document === 'FORMA_LIBRE'}
                        onChange={() => setFormData({ ...formData, preferred_document: 'FORMA_LIBRE' })}
                        className="hidden"
                      />
                      <span>🖨️ Factura Forma Libre</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      formData.preferred_document === 'RECIBO' ? 'bg-orange-500/20 border-orange-500/50 text-orange-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="preferred_doc"
                        checked={formData.preferred_document === 'RECIBO'}
                        onChange={() => setFormData({ ...formData, preferred_document: 'RECIBO' })}
                        className="hidden"
                      />
                      <span>📄 Recibo Digital</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setClientModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
