const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle2' });
  
  const isLogin = await page.$('input[type="password"]');
  if (isLogin) {
    await page.type('input[type="text"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Reportes BCV')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/check_prod_reportes.png', fullPage: true });
  await browser.close();
  console.log('Screenshot taken!');
})().catch(err => console.error(err));
