# TraderNOVA

Maquetado de trading: front de **Nodo Trading** (broker ALyC para acciones BYMA, CEDEARs y bonos), implementado a partir del diseño en Figma.

> Estado: **demo visual**. No hay backend: los datos son de ejemplo, el login no autentica y las órdenes, aprobaciones y formularios solo cambian el estado en pantalla (se pierden al recargar).

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript estricto
- Tailwind CSS v4 (tokens de diseño en `src/app/globals.css`)
- Gráficos en SVG propio (`src/components/charts`), sin librerías de charts
- Íconos: exportados del Figma (`public/figma`) + Material Symbols (`public/icons`)
- Fuentes Inter y JetBrains Mono auto-alojadas (`src/app/fonts`, licencia OFL)
- Vitest para la lógica de `src/lib`

## Correr en local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
npm run lint
npm test         # tests de cálculos (aranceles, formatos, valuaciones)
npm run icons    # re-sincroniza public/icons si agregás un <MsIcon name="…" />
```

## Pantallas

| Ruta | Pantalla | Origen |
| --- | --- | --- |
| `/` | Landing institucional | Figma |
| `/login` | Iniciar sesión (credenciales → 2FA) | Figma |
| `/onboarding` | Apertura de cuenta en 5 pasos (DNI según Figma) | Figma + pasos propios |
| `/dashboard` | Dashboard general de usuario | Figma |
| `/cotizaciones` | Cotizaciones y terminal de mercado | Figma |
| `/mercados` | Mercados en vivo, watchlist y heatmap | Figma |
| `/operar` | Boleta de operaciones (`?especie=GGAL&lado=venta`) | Figma |
| `/terminal/[símbolo]` | Terminal avanzada con RSI | Figma |
| `/tenencia` | Mi tenencia valorizada | Figma |
| `/ordenes` | Historial de órdenes | Propia (sin diseño) |
| `/cuentas` | Cuentas y fondos | Figma |
| `/informes` | Diario de trading con calendario | Figma |
| `/admin` | Consola staff | Figma |
| `/admin/usuarios`, `/admin/kyc` | Usuarios, cuentas y KYC | Figma |
| `/admin/tesoreria` | Tesorería y conciliación | Figma |
| `/admin/cumplimiento` | Cumplimiento PLA/FT (CNV/UIF) | Figma |
| `/ajustes`, `/soporte`, `/admin/ordenes`, `/admin/riesgo`, `/admin/soporte`, `/admin/auditoria` | "Próximamente" | Sin diseño |

Las pantallas que no son login y dashboard se armaron a partir de capturas del Figma (el conector alcanzó su límite de uso), así que respetan layout, contenido y sistema de diseño pero no son exactas al píxel.

## Estructura

```
src/
  app/                  Rutas (App Router). (app)/ = shell de inversor, admin/ = shell staff
  components/
    ui/                 Primitivos: Button, Badge, Card, Panel/Stat, Tabs, MsIcon, CopyField…
    charts/             LineChart, CandleChart, BarChart, Donut (SVG)
    layout/             AppShell, Sidebar, Topbar, MobileNav, nav-config
    trading/            Boleta, libro de órdenes, gráfico de velas, órdenes abiertas
    markets/ portfolio/ accounts/ journal/ onboarding/ admin/ dashboard/ auth/
  lib/
    mock-data.ts, market-data.ts, portfolio.ts, accounts.ts, journal.ts, admin-data.ts
    order-costs.ts      Aranceles de la boleta (en centavos enteros)
    format.ts           Formato es-AR
    random.ts           Generador con semilla: datos de demo idénticos en server y cliente
```

## Para pasar de demo a producto

- **Auth**: los `TODO(auth)` marcan dónde integrar backend y proteger rutas (`proxy.ts` o chequeo en el layout).
- **Datos**: reemplazar los módulos `src/lib/*-data.ts` por llamadas a la API manteniendo los tipos.
- **Tiempo real**: cotizaciones y libro de órdenes hoy son estáticos; con feed real conviene WebSocket/SSE.
- **Carga de archivos**: la validación del DNI es solo del lado del cliente; el servidor tiene que revalidar tipo real, tamaño y escanear.
