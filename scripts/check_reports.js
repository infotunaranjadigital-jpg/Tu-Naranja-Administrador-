const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle2' });

  const isLogin = await page.$('input[type="password"]');
  if (isLogin) {
    await page.type('input[type="text"]', 'jarvick');
    await page.type('input[type="password"]', 'jarvick2026');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Click en tab de Reportes BCV
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Reportes BCV')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2500));

  // Scroll más abajo para que la torta y su leyenda queden en el centro
  await page.evaluate(() => {
    window.scrollBy(0, 950);
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ 
    path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/15_reportes_grafico_torta_full.png'
  });
  await browser.close();
  console.log('SCREENSHOT_TORTA_FULL_OK');
})().catch(console.error);
