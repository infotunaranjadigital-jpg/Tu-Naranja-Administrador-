'use client';

import React, { useState } from 'react';
import { X, Check, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

interface RateBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: any;
  onRatesUpdated: (newRates: any) => void;
}

export default function RateBarModal({
  isOpen,
  onClose,
  rates,
  onRatesUpdated
}: RateBarModalProps) {
  if (!isOpen) return null;

  const [bcvUsd, setBcvUsd] = useState(rates?.bcv_usd?.toString() || '888.12');
  const [binanceUsdt, setBinanceUsdt] = useState(rates?.binance_usdt?.toString() || '1007.00');
  const [bcvEur, setBcvEur] = useState(rates?.bcv_eur?.toString() || '989.72');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const numBcv = parseFloat(bcvUsd) || 0;
  const numBinance = parseFloat(binanceUsdt) || 0;
  const computedAverage = ((numBcv + numBinance) / 2).toFixed(2);

  const handleSyncLive = async () => {
    setSyncing(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_LIVE' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al sincronizar en vivo');

      if (data.rate) {
        setBcvUsd(data.rate.bcv_usd.toString());
        setBinanceUsdt(data.rate.binance_usdt.toString());
        setBcvEur(data.rate.bcv_eur.toString());
        onRatesUpdated(data.rate);
        setSuccessMsg('¡Tasas sincronizadas con éxito desde BCV y Binance P2P!');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con los servicios de tasas');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bcv_usd: numBcv,
          binance_usdt: numBinance,
          bcv_eur: parseFloat(bcvEur) || (numBcv * 1.08),
          date: new Date().toISOString().split('T')[0]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar tasas');

      onRatesUpdated(data.rate);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="p-2 bg-orange-500/20 text-orange-400 rounded-lg text-lg">🇻🇪</span>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Control de Tasas de Cambio</h3>
            <p className="text-xs text-slate-400">Valores para liquidación hoy ({new Date().toLocaleDateString('es-VE')})</p>
          </div>
        </div>

        {/* Botón de Sincronización Automática */}
        <div className="my-3 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Actualización Automática
            </span>
            <span className="text-[11px] text-slate-400">
              Consulta en tiempo real la API de Binance P2P y BCV Oficial.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncLive}
            disabled={syncing}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow shadow-amber-500/20 whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Auto-Sync'}
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs p-2.5 rounded-xl my-2">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-xs p-2.5 rounded-xl my-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Dólar Oficial BCV (USD / VES)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={bcvUsd}
              onChange={(e) => setBcvUsd(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none text-sm"
              placeholder="Ej. 888.12"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Binance P2P (USDT / VES) — Promedio de Mercado
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={binanceUsdt}
              onChange={(e) => setBinanceUsdt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none text-sm"
              placeholder="Ej. 1007.00"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Euro Oficial BCV (EUR / VES)
            </label>
            <input
              type="number"
              step="0.01"
              value={bcvEur}
              onChange={(e) => setBcvEur(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none text-sm"
              placeholder="Ej. 989.72"
            />
          </div>

          {/* Automatic Average preview */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-amber-200 font-medium">Tasa Promedio Calculada (BCV + Binance) / 2:</span>
            <span className="text-sm font-bold font-mono text-yellow-300">{computedAverage} Bs.</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-1/2 py-2.5 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-orange-600/30 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Fijar Tasas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
