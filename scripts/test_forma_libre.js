const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle2' });

  const isLogin = await page.$('input[type="password"]');
  if (isLogin) {
    await page.type('input[type="text"]', 'jarvick');
    await page.type('input[type="password"]', 'jarvick2026');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Click en "Historial"
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Historial')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  // Filtrar por Facturas Forma Libre
  const selects = await page.$$('select');
  for (const s of selects) {
    const val = await page.evaluate(el => el.value, s);
    if (val === 'ALL' || val === 'FORMA_LIBRE' || val === 'RECIBO') {
      await s.select('FORMA_LIBRE');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Click en la primera factura de la lista
  const tableRows = await page.$$('tbody tr');
  if (tableRows.length > 0) {
    await tableRows[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }

  await page.screenshot({ 
    path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/20_forma_libre_updated.png',
    fullPage: false
  });

  await browser.close();
  console.log('SCREENSHOT_FORMA_LIBRE_OK');
})().catch(console.error);
