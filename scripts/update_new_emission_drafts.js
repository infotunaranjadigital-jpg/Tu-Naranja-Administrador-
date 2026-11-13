const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'NewEmissionView.tsx');
let code = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update lucide-react import to include Save and RotateCcw
code = code.replace(
  "import { \n  Plus, Trash2, Printer, FileText, CheckCircle2, \n  HelpCircle, ArrowRight, DollarSign, Calculator, ChevronDown \n} from 'lucide-react';",
  "import { \n  Plus, Trash2, Printer, FileText, CheckCircle2, \n  HelpCircle, ArrowRight, DollarSign, Calculator, ChevronDown, Save, RotateCcw \n} from 'lucide-react';"
);

// 2. Add draft state & logic right after items state
const targetStatePoint = `  // Retenciones Fiscales (Agentes de Retención SENIAT)
  const [applyWithholding, setApplyWithholding] = useState<boolean>(false);
  const [ivaRetentionPercent, setIvaRetentionPercent] = useState<number>(75);
  const [islrRetentionPercent, setIslrRetentionPercent] = useState<number>(2);

  // Items
  const [items, setItems] = useState<any[]>([
    { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 150.0 }
  ]);`;

const newDraftStates = `  // Retenciones Fiscales (Agentes de Retención SENIAT)
  const [applyWithholding, setApplyWithholding] = useState<boolean>(false);
  const [ivaRetentionPercent, setIvaRetentionPercent] = useState<number>(75);
  const [islrRetentionPercent, setIslrRetentionPercent] = useState<number>(2);

  // Items
  const [items, setItems] = useState<any[]>([
    { description: 'Manejo de Redes Sociales', category: 'MARKETING_RRSS', unit: '1.0', quantity: 1, amount: 150.0 }
  ]);

  // Manejo de Borradores Automáticos en localStorage
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [hasDraftInStorage, setHasDraftInStorage] = useState<boolean>(false);
  const previousClientIdRef = React.useRef<string>('');

  // 1. Restaurar borrador previo al montar el componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tu_naranja_new_emission_draft_v1');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedClientId) setSelectedClientId(draft.selectedClientId);
        if (draft.docType) setDocType(draft.docType);
        if (draft.isProspectMode !== undefined) setIsProspectMode(draft.isProspectMode);
        if (draft.prospectName !== undefined) setProspectName(draft.prospectName);
        if (draft.prospectRif !== undefined) setProspectRif(draft.prospectRif);
        if (draft.prospectPhone !== undefined) setProspectPhone(draft.prospectPhone);
        if (draft.prospectEmail !== undefined) setProspectEmail(draft.prospectEmail);
        if (draft.prospectAddress !== undefined) setProspectAddress(draft.prospectAddress);
        if (draft.customDocNumber !== undefined) setCustomDocNumber(draft.customDocNumber);
        if (draft.controlNumber !== undefined) setControlNumber(draft.controlNumber);
        if (draft.issueDate) setIssueDate(draft.issueDate);
        if (draft.dueDate) setDueDate(draft.dueDate);
        if (draft.currency) setCurrency(draft.currency);
        if (draft.rateType) setRateType(draft.rateType);
        if (draft.customRate !== undefined) setCustomRate(draft.customRate);
        if (draft.notes !== undefined) setNotes(draft.notes);
        if (draft.isPaid !== undefined) setIsPaid(draft.isPaid);
        if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
        if (draft.paymentReference !== undefined) setPaymentReference(draft.paymentReference);
        if (draft.applyWithholding !== undefined) setApplyWithholding(draft.applyWithholding);
        if (draft.ivaRetentionPercent !== undefined) setIvaRetentionPercent(draft.ivaRetentionPercent);
        if (draft.islrRetentionPercent !== undefined) setIslrRetentionPercent(draft.islrRetentionPercent);
        if (draft.items && draft.items.length) setItems(draft.items);
        if (draft.selectedRif) setSelectedRif(draft.selectedRif);
        setHasDraftInStorage(true);
        previousClientIdRef.current = draft.selectedClientId || '';
      } else {
        previousClientIdRef.current = initialClient?.id || (clients[0]?.id || '');
      }
    } catch {
      previousClientIdRef.current = initialClient?.id || (clients[0]?.id || '');
    }
    setIsDraftRestored(true);
  }, []);

  // 2. Guardar borrador automáticamente al modificar cualquier campo
  useEffect(() => {
    if (!isDraftRestored) return;
    const draft = {
      selectedClientId,
      docType,
      isProspectMode,
      prospectName,
      prospectRif,
      prospectPhone,
      prospectEmail,
      prospectAddress,
      customDocNumber,
      controlNumber,
      issueDate,
      dueDate,
      currency,
      rateType,
      customRate,
      notes,
      isPaid,
      paymentMethod,
      paymentReference,
      applyWithholding,
      ivaRetentionPercent,
      islrRetentionPercent,
      items,
      selectedRif,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('tu_naranja_new_emission_draft_v1', JSON.stringify(draft));
      setHasDraftInStorage(true);
    } catch {}
  }, [
    isDraftRestored,
    selectedClientId, docType, isProspectMode, prospectName, prospectRif, prospectPhone, prospectEmail, prospectAddress,
    customDocNumber, controlNumber, issueDate, dueDate, currency, rateType, customRate, notes,
    isPaid, paymentMethod, paymentReference, applyWithholding, ivaRetentionPercent, islrRetentionPercent, items, selectedRif
  ]);

  // Limpiar / descartar borrador
  const handleClearDraft = () => {
    try {
      localStorage.removeItem('tu_naranja_new_emission_draft_v1');
    } catch {}
    setHasDraftInStorage(false);
    const client = clients.find(c => c.id === selectedClientId) || clients[0];
    if (client) {
      setDocType(client.preferred_document === 'FORMA_LIBRE' ? 'FORMA_LIBRE' : 'RECIBO');
      setRateType(client.default_rate_type || 'BCV');
      setItems([{
        description: \`Manejo de Redes Sociales (\${new Date().toLocaleString('es-VE', { month: 'long' })})\`,
        category: 'MARKETING_RRSS',
        unit: '1.0',
        quantity: 1,
        amount: client.base_monthly_fee || 150
      }]);
      setNotes('');
      setCustomDocNumber('');
      setControlNumber('');
      setIsProspectMode(false);
      setProspectName('');
    }
  };`;

if (!code.includes(targetStatePoint)) {
  console.error('targetStatePoint not found!');
  process.exit(1);
}
code = code.replace(targetStatePoint, newDraftStates);

// 3. Make client change only apply defaults if user actively changed client after mount
const targetClientEffect = `  // When selected client changes, update defaults
  useEffect(() => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);`;

const newClientEffect = `  // When selected client changes, update defaults
  useEffect(() => {
    if (!selectedClientId || !isDraftRestored) return;
    // Si no cambió el cliente respecto al borrador, no sobreescribir lo que el usuario tenía guardado
    if (previousClientIdRef.current === selectedClientId) return;
    previousClientIdRef.current = selectedClientId;

    const client = clients.find(c => c.id === selectedClientId);`;

if (!code.includes(targetClientEffect)) {
  console.error('targetClientEffect not found!');
  process.exit(1);
}
code = code.replace(targetClientEffect, newClientEffect);

// 4. Remove draft on emission success
const targetOnSuccess = `      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir');

      onEmissionSuccess(data.document);`;

const newOnSuccess = `      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir');

      // Limpiar borrador tras emitir exitosamente
      try {
        localStorage.removeItem('tu_naranja_new_emission_draft_v1');
        setHasDraftInStorage(false);
      } catch {}

      onEmissionSuccess(data.document);`;

code = code.replace(targetOnSuccess, newOnSuccess);

// 5. Add Banner at top of form
const targetTopTitle = `      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-400" />
          Nueva Emisión de Cobro
        </h2>
        <p className="text-xs text-slate-400">
          Elige cliente, modalidad (Forma Libre o Recibo) y define con qué tasa liquidar.
        </p>
      </div>`;

const newTopTitleAndBanner = `      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-400" />
          Nueva Emisión de Cobro
        </h2>
        <p className="text-xs text-slate-400">
          Elige cliente, modalidad (Forma Libre o Recibo) y define con qué tasa liquidar.
        </p>
      </div>

      {/* Auto-Draft Notification Banner */}
      {hasDraftInStorage && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              <strong>Borrador automático activo:</strong> Si sales de la página o cambias de pestaña, tus datos se guardan en tiempo real y no se pierden.
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-xs text-slate-400 hover:text-rose-400 underline font-medium transition flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Descartar borrador / Limpiar</span>
          </button>
        </div>
      )}`;

if (!code.includes(targetTopTitle)) {
  console.error('targetTopTitle not found!');
  process.exit(1);
}
code = code.replace(targetTopTitle, newTopTitleAndBanner);

// 6. Add "Guardar Borrador" button next to submit
const targetSubmitBtn = `        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Generando...' : (
              docType === 'PRESUPUESTO' ? '🚀 Generar Presupuesto Online & Crear Enlace Público' :
              docType === 'FORMA_LIBRE' ? '🖨️ Emitir e Imprimir Forma Libre' : '📄 Emitir Recibo Digital'
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>`;

const newSubmitBtns = `        {/* Submit & Draft Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              alert('✅ Borrador guardado exitosamente en tu navegador. Tus datos permanecerán aquí aunque salgas o recargues la página.');
            }}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-2 border border-slate-800 shadow"
            title="Guardar borrador para continuar luego"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Guardar Borrador</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Generando...' : (
              docType === 'PRESUPUESTO' ? '🚀 Generar Presupuesto Online & Crear Enlace Público' :
              docType === 'FORMA_LIBRE' ? '🖨️ Emitir e Imprimir Forma Libre' : '📄 Emitir Recibo Digital'
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>`;

if (!code.includes(targetSubmitBtn)) {
  console.error('targetSubmitBtn not found!');
  process.exit(1);
}
code = code.replace(targetSubmitBtn, newSubmitBtns);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated NewEmissionView.tsx with auto-draft system!');
