const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle2' });

  // Handle Login if present
  const isLogin = await page.$('input[type="password"]');
  if (isLogin) {
    const userInput = await page.$('input[type="text"]');
    if (userInput) {
      await page.type('input[type="text"]', 'jarvick');
    }
    await page.type('input[type="password"]', 'naranja2026');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2500));
  }

  // Click on "Historial" tab
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Historial')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  // Filter by Forma Libre
  const selects = await page.$$('select');
  for (const s of selects) {
    const val = await page.evaluate(el => el.value, s);
    if (val === 'ALL' || val === 'FORMA_LIBRE' || val === 'RECIBO') {
      await s.select('FORMA_LIBRE');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1500));

  // Find Factura 300 row in table
  const rows = await page.$$('tbody tr');
  let clicked = false;
  for (const row of rows) {
    const text = await page.evaluate(el => el.textContent, row);
    if (text && (text.includes('300') || text.includes('000300')) && text.includes('Aguerrevere')) {
      // Find the print button or click row
      const printBtn = await row.$('button[title*="imprimir"]');
      if (printBtn) {
        await printBtn.click();
      } else {
        await row.click();
      }
      clicked = true;
      break;
    }
  }

  if (!clicked && rows.length > 0) {
    console.log('Row with 300 not specifically matched, clicking first row...');
    await rows[0].click();
  }

  await new Promise(r => setTimeout(r, 2000));

  // Ensure documents directory exists
  const outDir = 'C:\\Users\\Jarvick\\Documents\\Facturas';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pdfPath = path.join(outDir, 'Factura_000300_Clinica_Leopoldo_Aguerrevere.pdf');
  
  // Also take a screenshot to verify UI
  await page.screenshot({ path: path.join(outDir, 'Factura_000300_preview.png'), fullPage: true });

  // Generate PDF
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  console.log('PDF GENERATED SUCCESSFULLY AT:', pdfPath);
  await browser.close();
})().catch(console.error);
