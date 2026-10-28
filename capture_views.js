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

  console.log('1. Login...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_login.png') });

  await page.type('input[placeholder="jarvick o socia"]', 'jarvick');
  await page.type('input[type="password"]', 'jarvick2026');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2000));
  console.log('2. Dashboard...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_dashboard.png') });

  const clickNav = async (text) => {
    await page.evaluate((btnText) => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const target = btns.find(b => b.textContent.includes(btnText));
      if (target) target.click();
    }, text);
    await new Promise(r => setTimeout(r, 1200));
  };

  console.log('3. Clientes...');
  await clickNav('Clientes');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_clientes.png') });

  console.log('4. Emitir...');
  await clickNav('Emitir Factura');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_nueva_emision.png') });

  console.log('5. Historial...');
  await clickNav('Historial');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_historial_documentos.png') });

  console.log('6. Reportes...');
  await clickNav('Reportes BCV');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_reportes_bcv.png') });

  console.log('7. RRHH...');
  await clickNav('RRHH / Nómina');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_rrhh_nomina.png') });

  console.log('8. Vista Imprimible...');
  await clickNav('Historial');
  await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    if (rows.length > 0) rows[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_recibo_digital.png') });

  await browser.close();
  console.log('Completed all captures successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
