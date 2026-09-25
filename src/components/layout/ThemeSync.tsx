"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/store/hooks";

/** Aplica el tema elegido al <html>. El script inline del layout lo hace antes de pintar para evitar el parpadeo. */
export function ThemeSync() {
  const [settings] = useSettingsStore();
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
  return null;
}

/** Se ejecuta antes de hidratar: lee el tema guardado sin esperar a React. */
export const themeScript = `try{var s=JSON.parse(localStorage.getItem("nodo.v1.settings")||"null");document.documentElement.dataset.theme=(s&&s.theme)||"dark"}catch(e){}`;
