const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '..', 'data', 'tu_naranja.db');
const db = new DatabaseSync(dbPath);

const doc = db.prepare(`
  SELECT 
    d.*,
    c.name as client_name,
    c.business_name as client_business_name,
    c.rif as client_rif_fallback,
    c.phone as client_phone,
    c.email as client_email,
    c.address as client_address
  FROM documents d
  JOIN clients c ON d.client_id = c.id
  WHERE d.doc_number = 305 AND d.doc_type = 'FORMA_LIBRE'
`).get();

if (!doc) {
  console.error('Factura 305 no encontrada en la base de datos!');
  process.exit(1);
}

const items = JSON.parse(doc.items_json);

const formatBs = (num) => {
  return (num || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const itemsHtml = items.map((item, idx) => {
  const qty = Math.max(1, Number(item.quantity) || 1);
  const totalItemAmount = Number(item.amount) || (Number(item.unitPrice) * qty) || 0;
  const amountBs = item.amount_bs !== undefined
    ? Number(item.amount_bs)
    : (doc.currency === 'USD' ? (totalItemAmount * doc.applied_rate) : totalItemAmount);
  const unitPriceBs = item.unit_price_bs !== undefined
    ? Number(item.unit_price_bs)
    : (Number(item.unitPrice)
      ? (doc.currency === 'USD' ? Number(item.unitPrice) * doc.applied_rate : Number(item.unitPrice))
      : (amountBs / qty));

  return `
    <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: top;">
      <td style="padding: 9px 8px 9px 0; font-weight: 500; font-size: 11px; color: #0f172a; line-height: 1.35;">${item.description}</td>
      <td style="padding: 9px 8px; text-align: center; font-family: monospace; font-size: 11px; color: #334155;">${item.unit || '1.0'}</td>
      <td style="padding: 9px 8px; text-align: center; font-family: monospace; font-size: 11px; color: #334155;">${qty}</td>
      <td style="padding: 9px 12px; text-align: right; font-family: monospace; font-size: 11px; white-space: nowrap; color: #334155;">${formatBs(unitPriceBs)}</td>
      <td style="padding: 9px 0 9px 12px; text-align: right; font-family: monospace; font-weight: 700; font-size: 11px; white-space: nowrap; color: #0f172a;">${formatBs(amountBs)}</td>
    </tr>
  `;
}).join('');

const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura Nº 000305</title>
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #000;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      width: 216mm;
      height: 279mm;
      padding-top: 50mm;
      padding-left: 15mm;
      padding-right: 15mm;
      padding-bottom: 10mm;
      position: relative;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Fila 1: Fecha de emisión -->
    <div style="display: flex; justify-content: flex-end; padding-right: 24px; margin-bottom: 8px;">
      <div style="font-weight: 600; text-align: right; font-size: 12px;">
        <span style="color: #4b5563; margin-right: 8px;">Fecha De Emisión:</span>
        <span style="font-family: monospace; font-weight: 700; font-size: 13px;">${doc.issue_date}</span>
      </div>
    </div>

    <!-- Fila 2: Cabecera Cliente -->
    <div style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 8px; margin-bottom: 6px; padding-top: 8px; font-size: 12px;">
      <div style="grid-column: span 6;">
        <span style="font-weight: 700; margin-right: 4px;">Razón Social:</span>
        <span style="font-weight: 600; text-transform: uppercase;">${doc.client_business_name || doc.client_name}</span>
      </div>
      <div style="grid-column: span 3;">
        <span style="font-weight: 700; margin-right: 4px;">RIF / CI:</span>
        <span style="font-family: monospace; font-weight: 700;">${doc.client_rif || doc.client_rif_fallback || 'No especificado'}</span>
      </div>
      <div style="grid-column: span 3; text-align: right;">
        <span style="font-weight: 700; margin-right: 4px;">Telf:</span>
        <span>${doc.client_phone || '0414-1544252'}</span>
      </div>
    </div>

    <!-- Fila 3: Dirección Fiscal & Factura Nº -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 8px;">
      <div style="width: 70%;">
        <span style="font-weight: 700; margin-right: 4px; font-size: 12px;">Dirección Fiscal:</span>
        <span style="font-size: 11px; line-height: 1.25; color: #1f2937;">${doc.client_address || 'Caracas, Venezuela'}</span>
      </div>
      <div style="width: 30%; text-align: right;">
        <div style="font-weight: 900; font-size: 15px; letter-spacing: 0.05em;">
          FACTURA Nº ${doc.doc_number.toString().padStart(6, '0')}
        </div>
      </div>
    </div>

    <!-- Fila 4: Tabla de Ítems -->
    <div style="min-height: 90mm;">
      <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
        <thead>
          <tr style="border-bottom: 2px solid rgba(0,0,0,0.85); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;">
            <th style="padding: 10px 8px 10px 0; width: 42%;">Descripción</th>
            <th style="padding: 10px 8px; text-align: center; width: 12%;">Unidad</th>
            <th style="padding: 10px 8px; text-align: center; width: 8%;">Cant.</th>
            <th style="padding: 10px 12px; text-align: right; width: 19%;">Precio Unitario</th>
            <th style="padding: 10px 0 10px 12px; text-align: right; width: 19%;">Importe Bs.</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Datos Bancarios Mercantil -->
    <div style="font-size: 10px; color: #374151; margin-bottom: 24px; padding-top: 14px; border-top: 1px solid #d1d5db;">
      <p style="font-weight: 600;">
        Para emitir transferencia por favor hacer a la cuenta corriente 0105-0638-70-163832743-2
      </p>
      <p>Banco Mercantil. Gracias. Telf 0414-154 42 52</p>
    </div>

    <!-- Fila 5: Totales y Formas de Pago -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <!-- Formas de Pago -->
      <div style="width: 50%; font-size: 10px; line-height: 1.6; font-weight: 600; color: #374151;">
        <p style="font-weight: 700; text-decoration: underline; margin-bottom: 4px;">FORMA DE PAGO</p>
        <p>EFECTIVO: ____________________</p>
        <p>TRANSFERENCIA: ✓ ${doc.payment_reference || '0047900004480'}</p>
        <p>BANCO: Mercantil</p>
      </div>

      <!-- Subtotal, IVA 16%, Total -->
      <div style="width: 48%; text-align: right; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
          <span style="font-family: -apple-system, sans-serif; font-weight: 700; color: #374151;">Sub - Total (Bs.):</span>
          <span style="font-weight: 700;">${formatBs(doc.subtotal_bs)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
          <span style="font-family: -apple-system, sans-serif; font-weight: 700; color: #374151;">IVA (16%):</span>
          <span style="font-weight: 700;">${formatBs(doc.iva_amount_bs)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; border-top: 2px solid #000; padding-top: 6px;">
          <span style="font-family: -apple-system, sans-serif;">TOTAL A PAGAR (Bs.):</span>
          <span>${formatBs(doc.total_bs_applied)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  await page.setContent(fullHtml, { waitUntil: 'load' });

  // Output directories
  const outDir = 'C:\\Users\\Jarvick\\Documents\\Facturas';
  const artifactDir = 'C:\\Users\\Jarvick\\.gemini\\antigravity\\brain\\d1267f38-3d34-4f8d-ac4c-d72f852cf8dc';

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pdfName = 'Factura_000305_Clinica_Leopoldo_Aguerrevere.pdf';
  const imgName = 'Factura_000305_preview.png';

  const userPdf = path.join(outDir, pdfName);
  const userImg = path.join(outDir, imgName);
  const artPdf = path.join(artifactDir, pdfName);
  const artImg = path.join(artifactDir, imgName);

  // Generate Screenshot
  await page.screenshot({ path: userImg, fullPage: true });
  fs.copyFileSync(userImg, artImg);

  // Generate PDF
  await page.pdf({
    path: userPdf,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  fs.copyFileSync(userPdf, artPdf);

  console.log('PDF Y PREVIEW GENERADOS CON ÉXITO:');
  console.log('- PDF Usuario:', userPdf);
  console.log('- Preview Usuario:', userImg);
  console.log('- Artifact PDF:', artPdf);
  console.log('- Artifact Preview:', artImg);

  await browser.close();
})().catch(console.error);
