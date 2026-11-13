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
  await page.goto('http://localhost:3050', { waitUntil: 'networkidle2' });

  // Handle Login if present
  const isLogin = await page.$('input[type="password"]');
  if (isLogin) {
    const userInput = await page.$('input[type="text"]');
    if (userInput) {
      await page.type('input[type="text"]', 'jarvick');
    }
    await page.type('input[type="password"]', 'naranja2026');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2000));
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
    await rows[0].click();
  }

  await new Promise(r => setTimeout(r, 2000));

  const outDir = 'C:\\Users\\Jarvick\\Documents\\Facturas';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pdfPath = path.join(outDir, 'Factura_000300_Clinica_Leopoldo_Aguerrevere.pdf');
  const previewPath = path.join(outDir, 'Factura_000300_preview_fixed.png');
  
  await page.screenshot({ path: previewPath, fullPage: true });

  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  // Also copy to artifact folder
  const artifactDir = 'C:\\Users\\Jarvick\\.gemini\\antigravity\\brain\\c3ac62a8-026f-473e-ad65-f7d45ed19883';
  fs.copyFileSync(pdfPath, path.join(artifactDir, 'Factura_000300_Clinica_Leopoldo_Aguerrevere.pdf'));
  fs.copyFileSync(previewPath, path.join(artifactDir, 'Factura_000300_preview_fixed.png'));

  console.log('PDF & SCREENSHOT GENERATED AND COPIED SUCCESSFULLY!');
  await browser.close();
})().catch(console.error);
