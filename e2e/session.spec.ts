import { test, expect, toasts } from "./fixtures";

// Sábado 26/09/2026 a las 12:00 en Argentina: la rueda está cerrada.
const SATURDAY = new Date("2026-09-26T12:00:00-03:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(SATURDAY);
  await page.addInitScript(() => localStorage.setItem("nodo.v2.settings", JSON.stringify({ sessionMode: "real" })));
});

test("con la rueda cerrada no hay órdenes a mercado y las límite quedan para la próxima rueda", async ({ page }) => {
  await page.goto("/operar?especie=GGAL");
  await expect(page.getByText(/Mercado cerrado/).first()).toBeVisible();
  await expect(page.getByText(/abre el lunes 11:00/).first()).toBeVisible();
  await expect(page.getByLabel("Tipo de orden").getByRole("option", { name: "Mercado", exact: true })).toHaveAttribute("disabled", "");
  await expect(page.getByRole("button", { name: /Cargar orden de compra/ })).toBeVisible();
});

test("se puede abrir una rueda de demostración desde el aviso", async ({ page }) => {
  await page.goto("/operar?especie=GGAL");
  await expect(page.getByRole("button", { name: /Cargar orden de compra/ })).toBeVisible();
  await page.getByRole("button", { name: "Abrir rueda de demostración" }).click();
  await expect(page.getByRole("button", { name: "Abrir rueda de demostración" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Enviar orden de compra/ })).toBeVisible();
});

test("con la rueda cerrada no se ejecutan órdenes reales al cargar la página", async ({ page }) => {
  await page.goto("/operar?especie=AL30D");
  await page.waitForTimeout(2_500);
  expect(await toasts(page)).not.toContain("Orden ejecutada");
  await page.goto("/ordenes");
  await expect(page.locator("tbody tr", { hasText: "NYM-92790" })).toContainText("Parcialmente ejecutada");
});

test.describe("feriados", () => {
  test.beforeEach(async ({ page }) => {
    // Lunes 12/10/2026 al mediodía: feriado nacional, sin rueda.
    await page.clock.setFixedTime(new Date("2026-10-12T12:00:00-03:00"));
  });

  test("en un feriado la rueda está cerrada y se informa el motivo", async ({ page }) => {
    await page.goto("/operar?especie=GGAL");
    await expect(page.getByText(/feriado: Día de la Diversidad Cultural/).first()).toBeVisible();
    await expect(page.getByText(/abre mañana 11:00/).first()).toBeVisible();
  });
});
