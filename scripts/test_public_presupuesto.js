const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  
  // Acceso público directo sin cookies ni sesión
  await page.goto('https://admin.tunaranjadigital.com/presupuesto/doc_presupuesto_101', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ 
    path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/19_public_client_view.png'
  });

  await browser.close();
  console.log('PUBLIC_VIEW_SUCCESSFUL');
})().catch(console.error);
