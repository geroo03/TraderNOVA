import { test, expect, toasts } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/operar?especie=GGAL");
  await page.getByRole("checkbox", { name: /Pedir confirmación/ }).uncheck();
});

test("una compra límite por encima del mercado se ejecuta en el acto y persiste", async ({ page }) => {
  const price = page.getByLabel(/Precio límite/);
  const market = Number(await price.inputValue());
  await price.fill(String(Math.round(market * 1.02)));
  await page.getByLabel(/Cantidad/).fill("10");
  await page.getByRole("button", { name: /Enviar orden de compra/ }).click();
  await expect.poll(() => toasts(page)).toContain("Compraste 10 GGAL");

  // La orden ejecutada sigue ahí después de recargar (persistencia en localStorage).
  await page.goto("/ordenes");
  await page.reload();
  const row = page.locator("tbody tr", { hasText: "GGAL" }).filter({ hasText: "COMPRA" }).filter({ hasText: "Ejecutada" });
  await expect(row.first()).toBeVisible();
});

test("no deja vender una especie que no está en cartera", async ({ page }) => {
  await page.getByLabel("Especie").selectOption("TXAR");
  await page.getByRole("radio", { name: /VENDER/ }).click();
  await expect(page.getByText(/No tenés TXAR disponible para vender/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar orden de venta/ })).toBeDisabled();
});

test("el stop loss o el take profit se disparan solos", async ({ page }) => {
  test.setTimeout(60_000);
  const price = page.getByLabel(/Precio límite/);
  const entry = Math.round(Number(await price.inputValue()) * 1.002 * 100) / 100;
  await price.fill(String(entry));
  await page.getByRole("checkbox", { name: /Stop loss y take profit/ }).check();
  await page.getByRole("spinbutton", { name: "Stop loss" }).fill(String(Math.round(entry * 0.997 * 100) / 100));
  await page.getByRole("spinbutton", { name: "Take profit" }).fill(String(Math.round(entry * 1.003 * 100) / 100));
  await page.getByRole("button", { name: /Enviar orden de compra/ }).click();
  await page.getByRole("button", { name: "x20" }).click();
  await expect.poll(() => toasts(page), { timeout: 45_000 }).toMatch(/Stop loss ejecutado|Take profit alcanzado/);
  await expect(page.locator("tr", { hasText: /Stop loss|Take profit/ }).first()).toBeVisible();
});

test("el modo simulación usa saldo virtual y se reinicia", async ({ page }) => {
  await page.getByRole("switch", { name: "Modo simulación" }).click();
  // Al cambiar de modo la boleta se reinicia y vuelve a pedir confirmación.
  await page.getByRole("checkbox", { name: /Pedir confirmación/ }).uncheck();
  const banner = page.getByRole("status").filter({ hasText: "Modo simulación." });
  await expect(banner).toContainText("$10.000.000,00 de $10.000.000,00");
  await page.getByLabel(/Cantidad/).fill("100");
  await page.getByLabel("Tipo de orden").selectOption("Mercado");
  await page.getByRole("button", { name: /Simular compra/ }).click();
  await expect(banner).not.toContainText("$10.000.000,00 de");
  await page.getByRole("button", { name: "Reiniciar saldo" }).click();
  await expect(banner).toContainText("$10.000.000,00 de $10.000.000,00");
});

test("en simulación el dashboard mide el resultado contra el saldo virtual", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Rendimiento mensual")).toBeVisible();
  await page.getByRole("switch", { name: "Modo simulación" }).click();
  await expect(page.getByText("Resultado de la simulación")).toBeVisible();
  await expect(page.getByText("contra el saldo virtual inicial")).toBeVisible();
});
