'use client';

import React from 'react';
import PresupuestoCard from './PresupuestoCard';

interface PresupuestoPrintProps {
  document: any;
  onBack: () => void;
  onConvertToInvoice?: () => void;
}

export default function PresupuestoPrint({
  document: doc,
  onBack,
  onConvertToInvoice
}: PresupuestoPrintProps) {
  return (
    <PresupuestoCard
      document={doc}
      isAdmin={true}
      onBack={onBack}
      onConvertToInvoice={onConvertToInvoice}
    />
  );
}
