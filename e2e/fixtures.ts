import { test as base, expect, type Page } from "@playwright/test";

/**
 * Cada prueba arranca con el almacenamiento limpio (contexto nuevo) y la rueda forzada abierta,
 * para no depender de la hora a la que corra. Falla si la página tira errores de consola.
 */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.addInitScript(() => {
        const key = "nodo.v2.settings";
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ sessionMode: "always" }));
      });
      await use(errors);
      expect(errors, "errores de consola").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Texto de los avisos flotantes visibles. */
export async function toasts(page: Page) {
  return (await page.locator('[aria-live="polite"] [role="status"]').allInnerTexts()).join(" | ");
}
