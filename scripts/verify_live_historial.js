const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle2' });

  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    const userInput = await page.$('input[type="text"]');
    if (userInput) await page.type('input[type="text"]', 'jarvick');
    await page.type('input[type="password"]', 'jarvick2026');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    else await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2500));
  }

  // Click on Historial tab
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Historial')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2500));

  // Extract table rows text
  const rows = await page.$$eval('tbody tr', trs => trs.slice(0, 10).map(tr => tr.innerText.replace(/\n+/g, ' | ')));
  console.log('Top rows in Historial:');
  console.log(rows);

  await page.screenshot({ path: 'C:/Users/Jarvick/.gemini/antigravity/scratch/tu-naranja-admin/live_historial_verified.png' });
  console.log('Screenshot saved!');
  await browser.close();
})().catch(console.error);
