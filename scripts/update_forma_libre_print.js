const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'FormaLibrePrint.tsx');
let code = fs.readFileSync(targetPath, 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

// 1. Add states and update handler
const oldStateBlock = `export default function FormaLibrePrint({ document: doc, onBack, onMarkPaid }: FormaLibrePrintProps) {
  // Offsets en milimetros para calibracion fina
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);`;

const newStateBlock = `export default function FormaLibrePrint({ document: doc, onBack, onMarkPaid }: FormaLibrePrintProps) {
  // Offsets en milimetros para calibracion fina
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Estados editables de numeracion
  const [currentDocNumber, setCurrentDocNumber] = useState<string | number>(doc.doc_number || '');
  const [currentControlNumber, setCurrentControlNumber] = useState<string>(doc.control_number || '');
  const [isEditingNumbers, setIsEditingNumbers] = useState<boolean>(false);
  const [inputDocNumber, setInputDocNumber] = useState<string>(doc.doc_number?.toString() || '300');
  const [inputControlNumber, setInputControlNumber] = useState<string>(doc.control_number || '');
  const [isSavingNumbers, setIsSavingNumbers] = useState<boolean>(false);

  const handleUpdateNumbers = async () => {
    setIsSavingNumbers(true);
    try {
      const res = await fetch(\`/api/documents/\${doc.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_number: parseInt(inputDocNumber, 10) || inputDocNumber,
          control_number: inputControlNumber.trim()
        })
      });
      if (res.ok) {
        setCurrentDocNumber(parseInt(inputDocNumber, 10) || inputDocNumber);
        setCurrentControlNumber(inputControlNumber.trim());
        setIsEditingNumbers(false);
      } else {
        alert('Error al actualizar los números de factura/control.');
      }
    } catch {
      alert('Error de conexión al actualizar.');
    } finally {
      setIsSavingNumbers(false);
    }
  };`;

if (!code.includes(oldStateBlock)) {
  console.error('Could not find oldStateBlock!');
  process.exit(1);
}
code = code.replace(oldStateBlock, newStateBlock);

// 2. Replace title bar
code = code.replace(
  "🖨️ Impresión en Forma Libre (Factura Nº {doc.doc_number?.toString().padStart(6, '0')})",
  "🖨️ Impresión en Forma Libre (Factura Nº {currentDocNumber?.toString().padStart(6, '0')})"
);

// 3. Add button in top bar
const targetTopBtn = `<button
            onClick={() => setShowGuide(!showGuide)}`;
const newButtonAndGuide = `<button
            onClick={() => setIsEditingNumbers(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title="Cambiar o ajustar el número de factura o número de control SENIAT"
          >
            <Settings2 className="w-4 h-4" />
            <span>Nº Factura / Control</span>
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}`;

if (!code.includes(targetTopBtn)) {
  console.error('Could not find targetTopBtn!');
  process.exit(1);
}
code = code.replace(targetTopBtn, newButtonAndGuide);

// 4. Update printable sheet invoice & control number
const targetInvoiceBlock = `<div className="w-1/4 text-right">
              <span className="font-black text-sm tracking-wider">
                FACTURA Nº {doc.doc_number?.toString().padStart(6, '0')}
              </span>
            </div>`;

const newInvoiceBlock = `<div className="w-1/3 text-right">
              <div className="font-black text-sm tracking-wider">
                FACTURA Nº {currentDocNumber?.toString().padStart(6, '0')}
              </div>
              {currentControlNumber && (
                <div className="text-[11px] font-bold text-gray-800 tracking-wider mt-0.5">
                  Nº DE CONTROL: {currentControlNumber}
                </div>
              )}
            </div>`;

if (!code.includes(targetInvoiceBlock)) {
  console.error('Could not find targetInvoiceBlock!');
  process.exit(1);
}
code = code.replace(targetInvoiceBlock, newInvoiceBlock);

// 5. Add modal dialog at the end
const endTarget = `    </div>
  );
}`;

const modalCode = `      {/* Modal para editar Numero de Factura y Numero de Control SENIAT */}
      {isEditingNumbers && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              ✏️ Modificar Numeración SENIAT
            </h3>
            <p className="text-xs text-slate-400">
              Ajusta el número correlativo fiscal de la factura o el número de control pre-impreso del talonario. Al guardar, las siguientes facturas continuarán en secuencia.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Número de Factura
                </label>
                <input
                  type="number"
                  value={inputDocNumber}
                  onChange={(e) => setInputDocNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 outline-none"
                  placeholder="300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Número de Control SENIAT (Opcional, impreso en talonario)
                </label>
                <input
                  type="text"
                  value={inputControlNumber}
                  onChange={(e) => setInputControlNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-orange-500 outline-none"
                  placeholder="00-000300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingNumbers(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingNumbers}
                onClick={handleUpdateNumbers}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {isSavingNumbers ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

if (!code.includes(endTarget)) {
  console.error('Could not find endTarget!');
  process.exit(1);
}
code = code.replace(endTarget, modalCode);

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated FormaLibrePrint.tsx!');
