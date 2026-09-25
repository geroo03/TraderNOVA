import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/operar?especie=GGAL");
});

test("el gráfico muestra escalas, leyenda OHLC y cambia de tipo", async ({ page }) => {
  const chart = page.getByRole("application", { name: /Gráfico de GGAL/ });
  await expect(chart).toBeVisible();
  await expect(chart.getByText(/GGAL · 15m · Velas/)).toBeVisible();
  await expect(chart.getByText("Máx")).toBeVisible();
  await page.getByLabel("Tipo de gráfico").selectOption("heikin");
  await expect(chart.getByText(/GGAL · 15m · Heikin Ashi/)).toBeVisible();
  await page.getByRole("tab", { name: "1H" }).click();
  await expect(chart.getByText(/GGAL · 1H/)).toBeVisible();
});

test("los indicadores agregan líneas y paneles y se recuerdan al recargar", async ({ page }) => {
  await page.getByRole("button", { name: /Indicadores/ }).click();
  await page.getByLabel("RSI (14)").check();
  await page.getByLabel("MACD (12, 26, 9)").check();
  await page.getByLabel("Bandas de Bollinger (20, 2)").check();
  const chart = page.getByRole("application", { name: /Gráfico de GGAL/ });
  await expect(chart.locator("text", { hasText: "RSI (14)" })).toBeVisible();
  await expect(chart.locator("text", { hasText: "MACD (12, 26, 9)" })).toBeVisible();
  await expect(chart.getByText(/^BB /)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("application", { name: /Gráfico de GGAL/ }).locator("text", { hasText: "RSI (14)" })).toBeVisible();
});

test("el zoom con teclado y el ajuste de vista funcionan", async ({ page }) => {
  const chart = page.getByRole("application", { name: /Gráfico de GGAL/ });
  const candles = () => chart.locator("svg g[clip-path] > g > rect").count();
  const before = await candles();
  await chart.focus();
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  const zoomed = await candles();
  expect(zoomed).toBeLessThan(before);
  await page.getByRole("button", { name: "Ajustar vista" }).click();
  await expect.poll(candles).toBe(before);
});

test("el gráfico se amplía a toda la pantalla, permite operar y se cierra con Esc", async ({ page }) => {
  await page.getByRole("button", { name: "Ampliar gráfico" }).click();
  const dialog = page.getByRole("dialog", { name: /Gráfico ampliado de GGAL/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("application")).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Enviar orden de compra/ })).toBeVisible();
  const box = await dialog.getByRole("application").boundingBox();
  expect(box!.width).toBeGreaterThan(800);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("el zoom con pellizco (dos dedos) acerca el gráfico", async ({ page }) => {
  const chart = page.getByRole("application", { name: /Gráfico de GGAL/ });
  const candles = () => chart.locator("svg g[clip-path] > g > rect").count();
  const before = await candles();
  await chart.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const fire = (type: string, id: number, x: number) =>
      el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: "touch", clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
    const cx = r.left + r.width / 2;
    fire("pointerdown", 1, cx - 40);
    fire("pointerdown", 2, cx + 40);
    // Separar los dedos en varios pasos.
    for (let d = 60; d <= 200; d += 20) {
      fire("pointermove", 1, cx - d);
      fire("pointermove", 2, cx + d);
    }
    fire("pointerup", 1, cx - 200);
    fire("pointerup", 2, cx + 200);
  });
  await expect.poll(candles).toBeLessThan(before);
});
