import { test, expect } from "./fixtures";

const routes: [string, RegExp][] = [
  ["/", /Nodo/],
  ["/login", /Ingresá a tu cuenta/],
  ["/onboarding", /DNI/],
  ["/dashboard", /Evolución de Rendimiento/],
  ["/cotizaciones", /Cotizaciones y Terminal/],
  ["/mercados", /Mercados y Cotizaciones/],
  ["/operar", /Boleta de operación/],
  ["/terminal/GGAL", /Gráfico avanzado/],
  ["/tenencia", /Mi Tenencia Valorizada/],
  ["/ordenes", /Nueva orden/],
  ["/cuentas", /Cuentas y Fondos/],
  ["/informes", /Diario de Trading/],
  ["/ajustes", /Ajustes de la cuenta/],
  ["/soporte", /Centro de ayuda/],
  ["/admin", /Consola de Control/],
  ["/admin/usuarios", /Gestión de Usuarios/],
  ["/admin/kyc", /KYC/],
  ["/admin/ordenes", /Libro de Órdenes/],
  ["/admin/tesoreria", /Tesorería/],
  ["/admin/riesgo", /Límites & Riesgo/],
  ["/admin/cumplimiento", /Prevención de Lavado/],
  ["/admin/soporte", /Desk & Soporte/],
  ["/admin/auditoria", /Auditoría & Roles/],
];

for (const [path, text] of routes) {
  test(`carga ${path} sin errores`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByText(text).first()).toBeVisible();
  });
}

test("el buscador ⌘K navega a una especie", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("combobox").first().click();
  await page.keyboard.type("ypf");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/terminal\/YPFD/);
});

test("el tema claro se guarda entre recargas", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Cambiar a tema claro/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
