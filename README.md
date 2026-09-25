# TraderNOVA

Maquetado de trading: front de **Nodo Trading** (broker ALyC para acciones BYMA y CEDEARs), implementado a partir del diseño en Figma.

> Estado: **prototipo visual**. No hay backend. Todos los datos son de ejemplo y el login no autentica.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript estricto
- Tailwind CSS v4 (tokens de diseño en `src/app/globals.css`)
- Fuentes Inter y JetBrains Mono auto-alojadas (`src/app/fonts`, licencia OFL)

## Correr en local

```bash
npm install
npm run dev      # http://localhost:3000 → redirige a /login
npm run build    # build de producción
npm run lint
```

## Pantallas implementadas

| Ruta         | Pantalla del Figma                               |
| ------------ | ------------------------------------------------ |
| `/login`     | Iniciar Sesión - Nodo Trading                    |
| `/dashboard` | Dashboard General de Usuario - Nodo Trading      |

El resto de las pantallas del Figma (Mercados, Boleta, Portafolio, Diario, Onboarding DNI y el panel Admin) todavía no están implementadas. Los links del sidebar ya apuntan a sus rutas planificadas, así que hoy devuelven 404.

## Estructura

```
src/
  app/
    login/              Login (credenciales → token 2FA)
    (app)/              Rutas autenticadas: layout con sidebar + topbar
      dashboard/
    globals.css         Tokens de color, tipografía y sombras
  components/
    ui/                 Primitivos: Icon, Badge, Card, Amount/Change
    layout/             Sidebar, Topbar
    auth/               LoginForm, MarketShowcase
    dashboard/          KPIs, gráfico, distribución, variaciones, órdenes
  lib/
    types.ts            Tipos de dominio
    mock-data.ts        Datos de ejemplo (reemplazar por la API)
    format.ts           Formato es-AR de montos y porcentajes
    orders.ts           Cálculo de monto estimado (bonos cotizan c/100 VN)
public/figma/           SVG exportados del Figma (íconos y gráficos)
```

## Pendientes conocidos

- **Auth real**: los `TODO(auth)` en `LoginForm.tsx` y `(app)/layout.tsx` marcan dónde integrar backend y protección de rutas.
- **Gráficos**: el de rendimiento, los sparklines y el donut son SVG estáticos del Figma. Con datos reales conviene pasarlos a un componente de charts.
- **Mobile**: el sidebar se oculta debajo de `lg` y todavía no hay menú alternativo.
- Los selectores (período, benchmark, ARS/USD, "Tu Cartera / Mercado") guardan estado pero no cambian los datos.
