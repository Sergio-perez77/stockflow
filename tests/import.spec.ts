import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:3002' });

test('import flow with duplicates and CSV download', async ({ page }) => {
  // Página de datos
  await page.goto('/dashboard/configuracion/datos');

  // Insertar importación de ejemplo (botón visible en dev)
  await page.click('text=Insertar importación de ejemplo');

  // Continuar importación desde la tarjeta pendiente
  await page.click('text=Continuar importación');

  // Validar mapeo
  await page.click('text=Validar importación');

  // Esperar que aparezca el recuadro de duplicados
  await expect(page.locator('text=Se detectaron')).toBeVisible();

  // Descargar CSV y comprobar que se genera
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Descargar CSV'),
  ]);

  const suggested = download.suggestedFilename();
  expect(suggested).toContain('duplicados');

  // Aceptar confirm dialogs que aparezcan durante la importación
  page.on('dialog', (dialog) => dialog.accept());

  // Forzar importación incluyendo duplicados
  await page.click('text=Importar incluyendo duplicados');

  // Esperar un poco para que se guarden los datos
  await page.waitForTimeout(500);

  // Verificar que hay ventas en localStorage
  const ventas = await page.evaluate(() => JSON.parse(localStorage.getItem('ventas') || '[]'));

  expect(Array.isArray(ventas)).toBeTruthy();
  expect(ventas.length).toBeGreaterThan(0);
});
