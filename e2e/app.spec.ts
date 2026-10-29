import { expect, test, type Page } from '@playwright/test';

const watchConsole = (page: Page) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  return errors;
};

test('carga, muestra la escena 3D y completa el tutorial', async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Tu apiario, paso a paso' })).toBeVisible();
  await page.getByRole('button', { name: /Empezar con datos de ejemplo/ }).click();
  await expect(page.getByText('PASO 1 DE 4')).toBeVisible();
  const canvas = page.locator('.three-host canvas');
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  const box = (await canvas.boundingBox())!;
  expect(box.width).toBeGreaterThan(200); expect(box.height).toBeGreaterThan(150);
  // Camera controls are on screen and usable.
  for (const name of ['Acercar', 'Alejar', 'Vista desde arriba', 'Vista general del apiario']) {
    const b = page.getByRole('button', { name, exact: true });
    await expect(b).toBeInViewport(); await b.click();
  }
  // Drag to rotate must not select anything.
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 8 }); await page.mouse.up();
  await expect(page.getByText('PASO 1 DE 4')).toBeVisible();
  // Step 1 via the "next hive" control (also selects in the scene).
  await page.getByRole('button', { name: 'Colmena siguiente' }).click();
  await expect(page.getByText('PASO 2 DE 4')).toBeVisible();
  // Step 2: inspect a frame (accessible fallback button; raycast is covered by the canvas-click test).
  await page.getByRole('button', { name: '🔍 Inspeccionar un cuadro' }).click();
  await expect(page.getByText('PASO 3 DE 4')).toBeVisible();
  await expect(page.getByLabel('Observaciones')).toHaveValue(/cuadro 5/);
  await page.getByLabel('Observaciones').fill('Observación de prueba E2E');
  await page.getByRole('button', { name: 'Guardar registro de demostración' }).click();
  await expect(page.getByText('PASO 4 DE 4')).toBeVisible();
  await page.getByLabel('Tarea', { exact: true }).fill('Tarea E2E');
  await page.getByRole('combobox', { name: /^Prioridad/ }).selectOption('Alta');
  await page.getByRole('button', { name: '＋ Crear tarea' }).click();
  await expect(page.getByText('¡Tutorial completado!')).toBeVisible();
  await page.reload();
  await page.getByRole('navigation', { name: 'Secciones del cuaderno' }).getByRole('button', { name: 'Tareas' }).click();
  await expect(page.getByText('Tarea E2E')).toBeVisible();
  await page.getByRole('navigation', { name: 'Secciones del cuaderno' }).getByRole('button', { name: 'Revisiones' }).click();
  await expect(page.getByText(/Observación de prueba E2E/)).toBeVisible();
  // Day/night must not rebuild the WebGL canvas.
  await page.getByRole('navigation', { name: 'Secciones del cuaderno' }).getByRole('button', { name: 'Resumen' }).click();
  const handle = await page.locator('.three-host canvas').elementHandle();
  await page.getByRole('button', { name: /Noche/ }).click();
  await page.waitForTimeout(300);
  expect(await handle!.evaluate(el => el.isConnected)).toBe(true);
  expect(errors.filter(e => !/GPU stall|swiftshader|WebGL/i.test(e))).toEqual([]);
});

test('tocar una colmena en el canvas abre su ficha (raycast real sobre WebGL)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mi-apiario-3d.tutorial.started', '1'));
  await page.goto('./');
  const canvas = page.locator('.three-host canvas');
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  const box = (await canvas.boundingBox())!;
  // Scan a grid of points until a hive is hit (the scene layout depends on the viewport).
  let opened = false;
  for (let y = 0.3; y <= 0.8 && !opened; y += 0.1) for (let x = 0.2; x <= 0.8 && !opened; x += 0.1) {
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
    opened = await page.getByRole('dialog').isVisible().catch(() => false);
  }
  expect(opened).toBe(true);
  await page.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
