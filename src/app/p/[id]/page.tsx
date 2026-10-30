import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

async function Redirector({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/presupuesto/${id}`);
  return null;
}

export default function ShortPresupuestoRedirect(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">Redirigiendo...</div>}>
      <Redirector params={props.params} />
    </Suspense>
  );
}
