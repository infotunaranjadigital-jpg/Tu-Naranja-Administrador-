'use client';

import React, { useEffect, useState } from 'react';
import PresupuestoCard from '@/components/PresupuestoCard';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  id: string;
}

export default function PresupuestoClientView({ id }: Props) {
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDoc = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/documents/${id}`);
        const data = await res.json();

        if (!res.ok || !data.document) {
          throw new Error(data.error || 'Presupuesto no encontrado');
        }

        setDocument(data.document);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el presupuesto');
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/20 mb-4 animate-bounce">
          🍊
        </div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />
          Cargando Presupuesto Oficial...
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Tu Naranja Digital • Conectando con servidor
        </p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Presupuesto no encontrado</h2>
          <p className="text-xs text-slate-400 mb-6">
            El enlace solicitado no existe o el presupuesto fue removido. Verifica el identificador del documento.
          </p>
          <a
            href="https://tunaranjadigital.com"
            className="inline-block px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-600/30"
          >
            Ir a Tu Naranja Digital
          </a>
        </div>
      </div>
    );
  }

  return <PresupuestoCard document={document} isAdmin={false} />;
}
