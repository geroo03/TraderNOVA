import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

// PNG de 1×1 para la foto del DNI (la validación del cliente solo mira tipo y tamaño).
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

async function openAccount(page: Page) {
  await page.goto("/onboarding");
  await page.getByLabel("Nombre").fill("Valentina");
  await page.getByLabel("Apellido").fill("Gómez");
  await page.getByLabel("CUIT / CUIL").fill("27-35123456-8");
  await page.getByLabel("Correo electrónico").fill("vale@ejemplo.com");
  await page.getByLabel("Celular").fill("+54 9 11 4444-1234");
  await page.getByRole("button", { name: /Continuar a validación dni/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "dni-dorso.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: /Continuar a selfie/ }).click();
  await page.getByRole("button", { name: "Tomar selfie" }).click();
  await expect(page.getByText(/Coincidencia biométrica/)).toBeVisible();
  await page.getByRole("button", { name: /Continuar a perfil inversor/ }).click();
  await page.getByRole("button", { name: /Moderado/ }).click();
  await page.getByRole("button", { name: /Continuar a firma/ }).click();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByRole("heading", { name: /Tu cuenta está creada, Valentina/ })).toBeVisible();
}

test("el onboarding crea una cuenta nueva, vacía y en revisión que el staff aprueba", async ({ page }) => {
  await openAccount(page);
  await page.getByRole("button", { name: "Ir a mi cuenta" }).click();

  await expect(page.getByRole("heading", { name: /Bienvenido\/a, Valentina/ })).toBeVisible();
  await expect(page.getByText("Valentina Gómez").first()).toBeVisible();
  await expect(page.getByText("Tu cuenta es nueva")).toBeVisible();

  await page.goto("/operar");
  await expect(page.getByRole("alert").filter({ hasText: /legajo está en revisión/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar orden de compra/ })).toBeDisabled();

  await page.goto("/admin/kyc");
  await page.locator("tr", { hasText: "Valentina Gómez" }).getByRole("button", { name: "Auditar legajo" }).click();
  await page.getByRole("button", { name: "Aprobar comitente" }).click();

  await page.goto("/tenencia");
  await expect(page.getByText(/Todavía no tenés posiciones, Valentina/)).toBeVisible();
  await page.goto("/operar");
  await expect(page.getByText(/legajo está en revisión/)).toHaveCount(0);
});

test("los primeros pasos guían a vincular el banco e ingresar dinero", async ({ page }) => {
  await openAccount(page);
  await page.getByRole("button", { name: "Ir a mi cuenta" }).click();
  const checklist = page.locator("section", { hasText: /Bienvenido\/a, Valentina/ });
  await checklist.getByRole("button", { name: "Vincular" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("CBU / CVU").fill("0070999030004123456789");
  await dialog.getByLabel("Alias").fill("vale.gomez.galicia");
  await dialog.getByRole("button", { name: "Vincular cuenta" }).click();
  await expect(checklist.getByText(/2 de 4|1 de 4/)).toBeVisible();

  await checklist.getByRole("button", { name: "Ingresar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Notificar transferencia enviada" }).click();
  await expect(checklist.getByText(/pasos completos/)).toContainText(/[23] de 4/, { timeout: 15_000 });
  await expect(checklist.locator("li", { hasText: "Ingresá dinero" })).toHaveClass(/bg-positive/, { timeout: 15_000 });
});

test("el legajo de una cuenta nueva se aprueba solo a los pocos segundos", async ({ page }) => {
  await page.clock.install();
  await openAccount(page);
  await page.getByRole("button", { name: "Ir a mi cuenta" }).click();
  await expect(page.getByText(/En revisión: se aprueba/)).toBeVisible();
  await page.clock.runFor(25_000);
  await expect(page.getByText("Legajo aprobado por Compliance.")).toBeVisible();
});
