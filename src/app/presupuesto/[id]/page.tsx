import React, { Suspense } from 'react';
import PresupuestoClientView from './PresupuestoClientView';

async function PresupuestoWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PresupuestoClientView id={id} />;
}

export default function PublicPresupuestoPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-2xl shadow-xl shadow-orange-500/20 mb-3 animate-pulse">
            🍊
          </div>
          <p className="text-xs text-slate-400 font-mono">Cargando presupuesto digital...</p>
        </div>
      }
    >
      <PresupuestoWrapper params={props.params} />
    </Suspense>
  );
}
