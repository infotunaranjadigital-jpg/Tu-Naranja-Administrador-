const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Jarvick\\.gemini\\antigravity\\brain\\5b865809-13d5-4b31-b250-b427ff707464';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,1200'],
    defaultViewport: { width: 1400, height: 1200 }
  });

  const page = await browser.newPage();

  console.log('1. Accediendo a produccion...');
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle0' });

  // Iniciar sesion
  await page.type('input[placeholder="jarvick o socia"]', 'jarvick');
  await page.type('input[type="password"]', 'jarvick2026');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 2500));

  const clickNav = async (text) => {
    await page.evaluate((btnText) => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      const target = btns.find(b => b.textContent.includes(btnText));
      if (target) target.click();
    }, text);
    await new Promise(r => setTimeout(r, 1500));
  };

  console.log('2. Capturando Reportes con Pronóstico MRR y notas...');
  await clickNav('Reportes BCV');
  await new Promise(r => setTimeout(r, 1500));
  
  // Desplegar desglose si está disponible
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Ver Desglose'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_reportes_mes_a_mes.png'), fullPage: true });

  console.log('3. Capturando Directorio de Clientes con notas actualizadas...');
  await clickNav('Clientes');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_clientes_rif.png'), fullPage: true });

  await browser.close();
  console.log('Capturas de produccion listas.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
