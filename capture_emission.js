const puppeteer = require('puppeteer-core');
const path = require('path');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Jarvick\\.gemini\\antigravity\\brain\\5b865809-13d5-4b31-b250-b427ff707464';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,1100'],
    defaultViewport: { width: 1400, height: 1100 }
  });
  const page = await browser.newPage();
  await page.goto('https://admin.tunaranjadigital.com', { waitUntil: 'networkidle0' });
  await page.type('input[placeholder="jarvick o socia"]', 'jarvick');
  await page.type('input[type="password"]', 'jarvick2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Emitir Factura / Recibo'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_nueva_emision_categorizada.png'), fullPage: true });
  await browser.close();
  console.log('Nueva emision capturada.');
}

main().catch(console.error);
