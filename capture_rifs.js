const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Jarvick\\.gemini\\antigravity\\brain\\5b865809-13d5-4b31-b250-b427ff707464';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle0' });

  // Iniciar sesion
  await page.type('input[placeholder="jarvick o socia"]', 'jarvick');
  await page.type('input[type="password"]', 'jarvick2026');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));

  const clickNav = async (text) => {
    await page.evaluate((btnText) => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const target = btns.find(b => b.textContent.includes(btnText));
      if (target) target.click();
    }, text);
    await new Promise(r => setTimeout(r, 1500));
  };

  console.log('Capturando Clientes con RIF...');
  await clickNav('Clientes');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_clientes_rif.png') });

  console.log('Capturando Emision con selector de multi-RIF...');
  await clickNav('Emitir Factura');
  // Seleccionar CC Garcia o Arias DOC que tiene multiples RIF
  await page.select('select', 'arias-doc');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_emision_multi_rif.png') });

  await browser.close();
  console.log('Capturas completadas.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
