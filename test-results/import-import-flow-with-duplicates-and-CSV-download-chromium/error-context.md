# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: import.spec.ts >> import flow with duplicates and CSV download
- Location: tests/import.spec.ts:5:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://127.0.0.1:3002/dashboard/configuracion/datos", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.use({ baseURL: 'http://127.0.0.1:3002' });
  4  | 
  5  | test('import flow with duplicates and CSV download', async ({ page }) => {
  6  |   // Página de datos
> 7  |   await page.goto('/dashboard/configuracion/datos');
     |              ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  8  | 
  9  |   // Insertar importación de ejemplo (botón visible en dev)
  10 |   await page.click('text=Insertar importación de ejemplo');
  11 | 
  12 |   // Continuar importación desde la tarjeta pendiente
  13 |   await page.click('text=Continuar importación');
  14 | 
  15 |   // Validar mapeo
  16 |   await page.click('text=Validar importación');
  17 | 
  18 |   // Esperar que aparezca el recuadro de duplicados
  19 |   await expect(page.locator('text=Se detectaron')).toBeVisible();
  20 | 
  21 |   // Descargar CSV y comprobar que se genera
  22 |   const [download] = await Promise.all([
  23 |     page.waitForEvent('download'),
  24 |     page.click('text=Descargar CSV'),
  25 |   ]);
  26 | 
  27 |   const suggested = download.suggestedFilename();
  28 |   expect(suggested).toContain('duplicados');
  29 | 
  30 |   // Aceptar confirm dialogs que aparezcan durante la importación
  31 |   page.on('dialog', (dialog) => dialog.accept());
  32 | 
  33 |   // Forzar importación incluyendo duplicados
  34 |   await page.click('text=Importar incluyendo duplicados');
  35 | 
  36 |   // Esperar un poco para que se guarden los datos
  37 |   await page.waitForTimeout(500);
  38 | 
  39 |   // Verificar que hay ventas en localStorage
  40 |   const ventas = await page.evaluate(() => JSON.parse(localStorage.getItem('ventas') || '[]'));
  41 | 
  42 |   expect(Array.isArray(ventas)).toBeTruthy();
  43 |   expect(ventas.length).toBeGreaterThan(0);
  44 | });
  45 | 
```