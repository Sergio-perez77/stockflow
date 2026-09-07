const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });

  // Inyectar sesión demo para evitar redirección a login
  await context.addInitScript(() => {
    try {
      localStorage.setItem(
        'stockflow_session',
        JSON.stringify({ id: 'demo-admin', nombre: 'Sergio P.', email: 'admin@stockflow.com', role: 'admin' })
      );
      // Inyectar una venta existente para forzar duplicado con la importación de ejemplo
      localStorage.setItem('ventas', JSON.stringify([
        { id: 1, codigo: 'VTA-001', cliente: 'Cliente A', fecha: '2026-08-25', metodoPago: 'Efectivo', estado: 'Pagada', total: 1500, items: [], observaciones: '' }
      ]));
    } catch (e) {
      // ignore
    }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3002/dashboard/configuracion/datos', { timeout: 60000 });

    // Insertar importación de ejemplo
    await page.click('text=Insertar importación de ejemplo');

    // Continuar importación
    await page.click('text=Continuar importación');

    // Validar importación
    await page.click('text=Validar importación');

    // Esperar recuadro de duplicados
    await page.waitForSelector('text=Se detectaron', { timeout: 5000 });

    // Descargar CSV
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=Descargar CSV'),
    ]);

    const path = require('path');
    const fs = require('fs');

    const suggested = download.suggestedFilename();
    console.log('Download suggested filename:', suggested);

    fs.mkdirSync('test-artifacts', { recursive: true });
    const outPath = path.join(process.cwd(), 'test-artifacts', suggested);

    await download.saveAs(outPath);
    console.log('Saved artifact:', outPath);

    // Aceptar confirm dialogs
    page.on('dialog', (dialog) => dialog.accept());

    // Forzar importación
    await page.click('text=Importar incluyendo duplicados');

    await page.waitForTimeout(500);

    const ventasRaw = await page.evaluate(() => localStorage.getItem('ventas'));
    const ventas = ventasRaw ? JSON.parse(ventasRaw) : [];

    console.log('Ventas in localStorage length:', ventas.length);

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
})();
