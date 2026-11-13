const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to production...');
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle2' });

  // Check if we need to log in
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log('Logging in...');
    await page.type('input[type="password"]', 'naranja2026');
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  // Go to Emisión tab or look for Mantica invoice in Cobros / Facturas
  await page.waitForSelector('body');
  
  // Let's capture the dashboard / facturas
  await page.screenshot({ path: path.join(__dirname, '..', 'brain_verify_dashboard.png') });
  console.log('Saved dashboard screenshot');

  await browser.close();
})();
