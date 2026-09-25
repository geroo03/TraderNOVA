import { test, expect, toasts } from "./fixtures";

test("un depósito avisado se acredita a los pocos segundos", async ({ page }) => {
  await page.goto("/cuentas");
  const stat = page.getByText("Disponible ARS (inmediato)").locator("../..");
  const before = await stat.innerText();
  await page.getByRole("button", { name: "Notificar transferencia enviada" }).click();
  await expect.poll(() => toasts(page), { timeout: 15_000 }).toContain("Fondos acreditados");
  await expect(stat).not.toHaveText(before);
});

test("un retiro grande pasa por Tesorería y el inversor ve la aprobación", async ({ page }) => {
  await page.goto("/cuentas");
  await page.getByRole("button", { name: "Ir a retirar fondos" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Monto \(ARS\)/).fill("1500000");
  await expect(dialog.getByText(/lo aprueba Tesorería|queda pendiente hasta que Tesorería/)).toBeVisible();
  await dialog.getByRole("button", { name: "Solicitar retiro" }).click();
  await expect(page.locator("tr", { hasText: "1.500.000,00" }).first()).toContainText("En proceso");

  await page.goto("/admin/tesoreria");
  await page.locator("tr", { hasText: "Facundo Rossi" }).filter({ hasText: "APP" }).first().click();
  await page.getByRole("button", { name: /Confirmar y firmar token bancario/ }).click();

  await page.goto("/cuentas");
  await expect(page.locator("tr", { hasText: "1.500.000,00" }).first()).toContainText("Acreditado");
  await expect(page.getByRole("button", { name: /Notificaciones \(\d+ sin leer\)/ })).toBeVisible();
});

test("si Compliance bloquea al inversor, la boleta no lo deja operar", async ({ page }) => {
  await page.goto("/admin/usuarios?q=Facundo%20Rossi");
  await page.getByRole("button", { name: /Rechazar legajo \/ bloquear usuario/ }).click();

  await page.goto("/operar");
  await expect(page.getByRole("alert").filter({ hasText: /bloqueada por Compliance/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar orden de compra/ })).toBeDisabled();

  await page.goto("/admin/usuarios?q=Facundo%20Rossi");
  await page.getByRole("button", { name: "Aprobar comitente" }).click();
  await page.goto("/operar");
  await expect(page.getByText(/bloqueada por Compliance/)).toHaveCount(0);
});

test("una consulta del inversor llega al staff y la respuesta vuelve", async ({ page }) => {
  await page.goto("/soporte");
  await page.getByLabel("Asunto").fill("Consulta de prueba e2e");
  await page.getByLabel("Detalle").fill("Mensaje de prueba automatizada.");
  await page.getByRole("button", { name: "Enviar consulta" }).click();

  await page.goto("/admin/soporte");
  await page.getByText("Consulta de prueba e2e").first().click();
  await page.getByPlaceholder("Responder al comitente…").fill("Respuesta del staff");
  await page.getByRole("button", { name: "Enviar respuesta" }).click();

  await page.goto("/soporte");
  await page.getByText("Consulta de prueba e2e").first().click();
  await expect(page.getByText("Respuesta del staff")).toBeVisible();
});

test("las acciones del staff quedan en el log de auditoría", async ({ page }) => {
  await page.goto("/admin/tesoreria");
  await page.getByRole("button", { name: /Conciliación automática/ }).click();
  await expect.poll(() => toasts(page), { timeout: 5_000 }).toContain("aprobado");
  await page.goto("/admin/auditoria");
  await expect(page.locator("tbody tr", { hasText: "Bot STP COELSA" }).first()).toBeVisible();
});
