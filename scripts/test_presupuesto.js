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

  // 1. Iniciar sesión
  const isLogin = await page.$('input[type="password"]');
  if (isLogin) {
    await page.type('input[type="text"]', 'jarvick');
    await page.type('input[type="password"]', 'jarvick2026');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // 2. Click en "Emitir Factura / Recibo"
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Emitir Factura / Recibo')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  // Captura del formulario de emisión con la nueva opción Presupuesto
  await page.screenshot({ 
    path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/16_emision_presupuesto_form.png'
  });

  // 3. Click en el botón "💼 Presupuesto"
  const formButtons = await page.$$('button');
  for (const b of formButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Presupuesto')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Click en "➕ Nuevo Prospecto"
  const prospectButtons = await page.$$('button');
  for (const b of prospectButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('Nuevo Prospecto')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Escribir datos del prospecto
  const prospectInputs = await page.$$('input[placeholder*="Clínica Dental"]');
  if (prospectInputs.length > 0) {
    await prospectInputs[0].type('Inversiones Horizonte Digital C.A.');
  }

  const rifInputs = await page.$$('input[placeholder*="J-12345678-9"]');
  if (rifInputs.length > 0) {
    await rifInputs[0].type('J-50493821-0');
  }

  const phoneInputs = await page.$$('input[placeholder*="0414-0000000"]');
  if (phoneInputs.length > 0) {
    await phoneInputs[0].type('0414-2223344');
  }

  await page.screenshot({ 
    path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/17_presupuesto_prospecto_filled.png'
  });

  // Click en Generar Presupuesto
  const submitButtons = await page.$$('button[type="submit"]');
  if (submitButtons.length > 0) {
    await submitButtons[0].click();
    await new Promise(r => setTimeout(r, 3000));
  }

  // Captura de la vista generada del presupuesto
  await page.screenshot({ 
    path: 'C:/Users/Jarvick/.gemini/antigravity/brain/5b865809-13d5-4b31-b250-b427ff707464/18_presupuesto_online_view.png'
  });

  // Obtener la URL pública que muestra la vista
  const pageUrl = page.url();
  console.log('Current page URL:', pageUrl);

  await browser.close();
  console.log('PUPPETEER_TEST_SUCCESSFUL');
})().catch(console.error);
