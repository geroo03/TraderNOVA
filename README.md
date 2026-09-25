# TraderNOVA

Front de **Nodo Trading**, un broker ALyC para operar acciones BYMA, CEDEARs y bonos. Incluye dos aplicaciones en un mismo proyecto Next.js:

- **Inversor**: dashboard, cotizaciones, mercados en vivo, boleta de operaciones, terminal avanzada, tenencia, cuentas y fondos, diario de trading.
- **Staff (back-office)**: consola, usuarios, KYC, tesorería y cumplimiento PLA/FT (CNV/UIF).

Además hay una landing institucional, login con 2FA y apertura de cuenta en 5 pasos.

> **Estado: demo visual.** No hay backend. Los datos son de ejemplo, el login no autentica y las órdenes, aprobaciones y formularios solo cambian el estado en pantalla (se pierden al recargar).

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript estricto
- Tailwind CSS v4 (tokens de diseño en `src/app/globals.css`)
- Gráficos en SVG propio (`src/components/charts`), sin librerías de charts
- Íconos: exportados de Figma (`public/figma`) y Material Symbols (`public/icons`)
- Fuentes Inter y JetBrains Mono auto-alojadas (`src/app/fonts`, licencia OFL)
- Vitest para la lógica de `src/lib`
- ESLint con `eslint-config-next`

> Esta versión de Next.js tiene cambios respecto de versiones anteriores. Ante dudas de APIs o convenciones, consultar la documentación incluida en `node_modules/next/dist/docs/` (ver [AGENTS.md](AGENTS.md)).

## Puesta en marcha

Requiere Node.js compatible con Next.js 16 (20.9 o superior).

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests de `src/lib` (aranceles, formatos, valuaciones, matemática de gráficos) |
| `npm run icons` | Re-sincroniza `public/icons` y regenera `ms-icon-names.ts` |

### Íconos

Los Material Symbols se usan con `<MsIcon name="…" />`. El script `npm run icons` escanea `src/`, copia a `public/icons` solo los SVG usados y genera el tipo `MsIconName` (`src/components/ui/ms-icon-names.ts`, no editar a mano). Cada vez que uses un ícono nuevo hay que correrlo. Los SVG se commitean, así que el paquete `@material-symbols/svg-400` es solo dependencia de desarrollo.

## Pantallas

### Públicas

| Ruta | Pantalla | Origen |
| --- | --- | --- |
| `/` | Landing institucional | Figma |
| `/login` | Iniciar sesión (credenciales → 2FA) | Figma |
| `/onboarding` | Apertura de cuenta en 5 pasos (DNI según Figma) | Figma + pasos propios |

### Inversor (shell `(app)`)

| Ruta | Pantalla | Origen |
| --- | --- | --- |
| `/dashboard` | Dashboard general de usuario | Figma |
| `/cotizaciones` | Cotizaciones y terminal de mercado | Figma |
| `/mercados` | Mercados en vivo, watchlist y heatmap | Figma |
| `/operar` | Boleta de operaciones (`?especie=GGAL&lado=venta`) | Figma |
| `/terminal/[symbol]` | Terminal avanzada con RSI | Figma |
| `/tenencia` | Mi tenencia valorizada | Figma |
| `/ordenes` | Historial de órdenes | Propia (sin diseño) |
| `/cuentas` | Cuentas y fondos | Figma |
| `/informes` | Diario de trading con calendario | Figma |

### Staff (shell `admin`)

| Ruta | Pantalla | Origen |
| --- | --- | --- |
| `/admin` | Consola staff | Figma |
| `/admin/usuarios`, `/admin/kyc` | Usuarios, cuentas y KYC | Figma |
| `/admin/tesoreria` | Tesorería y conciliación | Figma |
| `/admin/cumplimiento` | Cumplimiento PLA/FT (CNV/UIF) | Figma |

### Marcadas como "Próximamente"

`/ajustes`, `/soporte`, `/admin/ordenes`, `/admin/riesgo`, `/admin/soporte` y `/admin/auditoria` muestran el componente `ComingSoon`: no tienen diseño.

> Las pantallas que no son login ni dashboard se armaron a partir de capturas del Figma (el conector alcanzó su límite de uso). Respetan layout, contenido y sistema de diseño, pero no son exactas al píxel.

## Estructura

```
src/
  app/                  Rutas (App Router)
    (app)/              Shell de inversor
    admin/              Shell de staff
    login/ onboarding/  Flujos públicos
    globals.css         Tokens de diseño (Tailwind v4)
    fonts/              Inter y JetBrains Mono
  components/
    ui/                 Primitivos: Button, Badge, Card, Page, Tabs, MsIcon, CopyField, ComingSoon…
    charts/             LineChart, CandleChart, BarChart, Donut (SVG)
    layout/             AppShell, Sidebar, Topbar, MobileNav, nav-config (menús de inversor y staff)
    trading/            Boleta, libro de órdenes, time & sales, gráfico de velas, órdenes abiertas
    dashboard/ markets/ portfolio/ accounts/ journal/ onboarding/ admin/ auth/
  lib/
    types.ts            Tipos compartidos
    mock-data.ts, market-data.ts, portfolio.ts, accounts.ts, journal.ts, admin-data.ts   Datos de demo
    order-costs.ts      Aranceles de la boleta (en centavos enteros)
    orders.ts           Monto estimado (los bonos cotizan cada 100 VN)
    chart-math.ts       Puntos y medias móviles para los gráficos
    format.ts           Formato es-AR (punto de miles, coma decimal)
    random.ts           Generador con semilla: datos idénticos en server y cliente
scripts/sync-icons.mjs  Sincronización de íconos
```

### Convenciones

- Los datos de demo se generan con semilla (`random.ts`) para evitar diferencias de hidratación entre server y cliente.
- El estado de órdenes de la demo vive en el hook `useOrders`; las órdenes a mercado se simulan ejecutadas al instante.
- Los montos se formatean siempre con `format.ts` (locale es-AR); los aranceles se calculan en centavos enteros.

## Para pasar de demo a producto

- **Auth**: los `TODO(auth)` marcan dónde integrar el backend y proteger rutas (`proxy.ts` o chequeo de sesión en el layout; ver `AppShell.tsx` y `LoginForm.tsx`).
- **Datos**: reemplazar los módulos de datos de `src/lib` (`mock-data`, `market-data`, `portfolio`, `accounts`, `journal`, `admin-data`) por llamadas a la API, manteniendo los tipos.
- **Tiempo real**: cotizaciones y libro de órdenes hoy son estáticos; con un feed real conviene WebSocket/SSE.
- **Órdenes**: `useOrders` es estado local; debe pasar a enviar y consultar órdenes al backend.
- **Carga de archivos**: la validación del DNI es solo del lado del cliente; el servidor tiene que revalidar el tipo real, el tamaño y escanear el archivo.
- **Pestaña "Mercado" de Top Movers** (`TopMovers.tsx`): necesita su propio endpoint; hoy muestra la misma lista.
