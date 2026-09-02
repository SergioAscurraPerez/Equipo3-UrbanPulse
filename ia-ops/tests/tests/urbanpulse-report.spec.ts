import { test, expect } from '@playwright/test'; 

test('el ciudadano puede enviar un reporte valido', async ({ page }) => { 
  await page.goto('http://localhost:3000'); 
  await page.getByPlaceholder('Ej: Hay un bache grande en la avenida principal...').fill('Hay un bache enorme en la avenida principal'); 
  await page.getByRole('button', { name: 'Enviar reporte' }).click(); 
  await expect(page.getByText('Reporte enviado correctamente.')).toBeVisible({ timeout: 20000 }); 
}); 

test('el formulario rechaza descripcion vacia', async ({ page }) => { 
  await page.goto('http://localhost:3000'); 
  await page.getByRole('button', { name: 'Enviar reporte' }).click(); 
  await expect(page.getByText('La descripción es obligatoria.')).toBeVisible(); 
});