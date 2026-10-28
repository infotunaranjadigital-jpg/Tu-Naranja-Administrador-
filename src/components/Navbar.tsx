'use client';

import React, { useState } from 'react';
import { 
  FileText, Users, DollarSign, BarChart3, 
  Briefcase, PlusCircle, LogOut, RefreshCw, CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  onLogout: () => void;
  rates: any;
  onRefreshRates: () => void;
  onOpenRatesModal: () => void;
}

export default function Navbar({
  currentTab,
  onTabChange,
  user,
  onLogout,
  rates,
  onRefreshRates,
  onOpenRatesModal
}: NavbarProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      {/* Top Banner: Tasa Monitor */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 px-4 py-1.5 text-xs text-white font-medium flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3 overflow-x-auto py-0.5">
          <span className="font-bold flex items-center gap-1 uppercase tracking-wider text-[11px] bg-black/20 px-2 py-0.5 rounded">
            🇻🇪 Tasas del Día ({rates?.date || 'Hoy'}):
          </span>
          <div className="flex items-center gap-2 bg-black/15 px-2.5 py-0.5 rounded-full">
            <span className="text-orange-100">BCV USD:</span>
            <span className="font-bold font-mono text-sm">{rates?.bcv_usd?.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
          </div>
          <div className="flex items-center gap-2 bg-black/15 px-2.5 py-0.5 rounded-full">
            <span className="text-amber-100">Binance P2P:</span>
            <span className="font-bold font-mono text-sm">{rates?.binance_usdt?.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-300/40">
            <span className="text-amber-200 font-semibold">★ Promedio:</span>
            <span className="font-bold font-mono text-sm text-yellow-200">{rates?.average_usd?.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
          </div>
          <div className="flex items-center gap-2 bg-black/15 px-2.5 py-0.5 rounded-full hidden sm:flex">
            <span className="text-orange-100">BCV EUR:</span>
            <span className="font-bold font-mono text-sm">{rates?.bcv_eur?.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
          </div>
        </div>

        <button 
          onClick={onOpenRatesModal}
          className="ml-2 bg-white/20 hover:bg-white/30 text-white text-[11px] px-2.5 py-1 rounded transition flex items-center gap-1 font-semibold whitespace-nowrap"
        >
          <RefreshCw className="w-3 h-3" />
          Ajustar Tasas
        </button>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-orange-500/20">
              🍊
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Tu Naranja Digital
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Sistema Administrativo & RRHH
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'dashboard' 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Tablero
            </button>

            <button
              onClick={() => onTabChange('clients')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'clients' 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Clientes
            </button>

            <button
              onClick={() => onTabChange('new-emission')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30`}
            >
              <PlusCircle className="w-4 h-4" />
              Emitir Factura / Recibo
            </button>

            <button
              onClick={() => onTabChange('documents')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'documents' 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Historial
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'reports' 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Reportes BCV
            </button>

            <button
              onClick={() => onTabChange('team')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentTab === 'team' 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              RRHH / Nómina
            </button>
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user?.name || 'Administrador'}</div>
              <div className="text-[10px] text-orange-400 font-mono capitalize">{user?.role || 'admin'}</div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav links */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 gap-2 bg-slate-950 border-t border-slate-800 text-xs">
        <button onClick={() => onTabChange('dashboard')} className="whitespace-nowrap px-2 py-1 text-slate-300">Tablero</button>
        <button onClick={() => onTabChange('clients')} className="whitespace-nowrap px-2 py-1 text-slate-300">Clientes</button>
        <button onClick={() => onTabChange('new-emission')} className="whitespace-nowrap px-2 py-1 text-orange-400 font-bold">Emitir (+)</button>
        <button onClick={() => onTabChange('documents')} className="whitespace-nowrap px-2 py-1 text-slate-300">Historial</button>
        <button onClick={() => onTabChange('reports')} className="whitespace-nowrap px-2 py-1 text-slate-300">Reportes</button>
        <button onClick={() => onTabChange('team')} className="whitespace-nowrap px-2 py-1 text-slate-300">RRHH</button>
      </div>
    </header>
  );
}
