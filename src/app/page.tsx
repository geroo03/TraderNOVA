import type { Metadata } from "next";
import Link from "next/link";
import { CandleChart } from "@/components/charts/CandleChart";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { formatDecimal } from "@/lib/format";
import { instruments, priceCandles } from "@/lib/market-data";

export const metadata: Metadata = {
  title: "Nodo Trading · Invertí en acciones y CEDEARs",
  description: "Broker ALyC con acceso DMA a BYMA, gráficos avanzados y comisiones desde 0,15%.",
};

const nav = [
  ["#caracteristicas", "Características"],
  ["#como-funciona", "Cómo funciona"],
  ["#comisiones", "Comisiones"],
  ["#faq", "FAQ"],
] as const;

const features: { icon: MsIconName; title: string; text: string }[] = [
  { icon: "candlestick_chart", title: "Gráficos avanzados", text: "Indicadores técnicos en tiempo real, medias móviles, RSI, MACD, dibujo de tendencias y múltiples temporalidades sin costo adicional." },
  { icon: "psychology", title: "Diario de trading con IA", text: "Detección inteligente de patrones de inversión, cálculo automático de relación riesgo/beneficio y notas de set-ups en tus favoritos." },
  { icon: "summarize", title: "Reportes automáticos", text: "Liquidación de dividendos al instante, rendimientos ajustados por inflación e informes fiscales listos para AFIP." },
];

const steps = [
  ["Creá tu cuenta gratis", "Validá tu identidad con DNI argentino y selfie biométrica desde tu celular o web en menos de 5 minutos.", "Aprobación automática Renaper"],
  ["Fondeá en pesos o dólares", "Transferí desde tu banco o billetera virtual a tu CBU/CVU propio con acreditación inmediata.", "Acreditación 24/7 sin demora"],
  ["Operá como un profesional", "Elegí acciones locales, CEDEARs de Wall Street o bonos soberanos y enviá órdenes directas al mercado.", "DMA sin intermediación humana"],
] as const;

const fees: [string, string, string, string][] = [
  ["Apertura y mantenimiento de cuenta", "$0,00", "Sin plazo", "Sin mínimos ni costos fijos"],
  ["Acciones locales (BYMA)", "0,15%", "CI / 24hs", "+ derechos de mercado"],
  ["CEDEARs (Empresas globales en ARS/USD)", "0,15%", "CI / 24hs", "+ derechos de mercado"],
  ["Bonos soberanos y letras", "0,10%", "CI / 24hs", "Arancel preferencial de bonos"],
  ["Operatoria dólar MEP (automática)", "0% extra", "Parking normativo", "Solo arancel estándar del bono"],
  ["Custodia en Caja de Valores", "Bonificada 100%", "Permanente", "Titularidad directa a tu nombre"],
];

const faqs = [
  ["¿Qué necesito para abrir una cuenta comitente en Nodo?", "Solo tu DNI argentino vigente, una selfie y una cuenta bancaria a tu nombre. El proceso es 100% digital y demora unos 5 minutos."],
  ["¿Mi dinero e inversiones están realmente protegidos?", "Sí. Los títulos se custodian en Caja de Valores S.A. a tu nombre y Nodo opera como ALyC registrado ante la CNV."],
  ["¿Qué es un CEDEAR y cómo cobro los dividendos?", "Es un certificado que representa acciones extranjeras y cotiza en pesos en BYMA. Los dividendos se acreditan automáticamente en tu cuenta."],
  ["¿Puedo comprar dólar MEP en Nodo?", "Sí, con la operatoria automática: comprás un bono en pesos y lo vendés en dólares respetando el parking normativo, en un solo paso."],
];

export default function LandingPage() {
  const ggal = instruments[0];
  const preview = instruments.slice(0, 5);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-surface-high bg-surface-lowest/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-[-0.45px]">Nodo</span>
            <span className="hidden sm:inline-flex"><Badge className="uppercase">BYMA &amp; CEDEARs</Badge></span>
          </Link>
          <nav aria-label="Secciones" className="hidden items-center gap-5 text-sm text-fg-muted md:flex">
            {nav.map(([href, label]) => (
              <a key={href} href={href} className="hover:text-fg">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block">
              <ButtonLink href="/login" variant="ghost" size="sm">
                Iniciar sesión
              </ButtonLink>
            </span>
            <ButtonLink href="/onboarding" size="sm">
              Abrir cuenta gratis
            </ButtonLink>
          </div>
        </div>
        <div className="border-t border-surface-high bg-surface-lowest">
          <p className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-1.5 font-mono text-[11px] whitespace-nowrap text-fg-subtle">
            <span className="flex items-center gap-1 text-positive"><StatusDot /> MERCADO EN VIVO</span>
            <span>MERVAL <span className="text-positive">+2,1%</span></span>
            <span>DÓLAR MEP <span className="text-fg">$1.285,40</span></span>
            <span>RIESGO PAÍS <span className="text-fg">1.180 bps</span></span>
            {preview.map((i) => (
              <span key={i.symbol}>
                {i.symbol} <span className={i.changePct >= 0 ? "text-positive" : "text-negative"}>{i.changePct > 0 ? "+" : ""}{formatDecimal(i.changePct)}%</span>
              </span>
            ))}
          </p>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pt-16 pb-12 text-center">
          <div aria-hidden className="absolute top-0 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary-strong/15 blur-[120px]" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5">
            <Badge tone="primary" pill className="px-3 py-1">
              <MsIcon name="bolt" size={12} /> DMA directo a BYMA · Cero latencia en ejecución
            </Badge>
            <h1 className="text-4xl font-bold tracking-[-1.5px] sm:text-5xl">Invertí en acciones y CEDEARs con herramientas de trader</h1>
            <p className="max-w-2xl text-base text-fg-muted">
              Accedé al mercado financiero argentino e internacional con gráficos avanzados de nivel institucional, libro de órdenes de 5
              niveles en tiempo real y comisiones transparentes desde 0,15%.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/onboarding" size="lg" iconRight="arrow_forward">
                Abrir cuenta
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="secondary" icon="play_circle">
                Ver demo interactiva
              </ButtonLink>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-fg-muted">
              {["Registro 100% digital en 5 min", "Sin costo de apertura ni mantenimiento", "Custodia Caja de Valores"].map((t) => (
                <li key={t} className="flex items-center gap-1">
                  <MsIcon name="check_circle" size={14} className="text-positive" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto mt-12 max-w-5xl">
            <Card className="overflow-hidden text-left shadow-2xl ring-1 ring-surface-highest">
              <div className="flex items-center justify-between border-b border-surface-high px-4 py-2">
                <span className="flex items-center gap-2 text-xs">
                  <span className="flex gap-1">
                    <span className="size-2.5 rounded-full bg-alert" />
                    <span className="size-2.5 rounded-full bg-[#f5b942]" />
                    <span className="size-2.5 rounded-full bg-positive" />
                  </span>
                  Terminal DMA Nodo v2.14 · en vivo
                </span>
                <span className="text-label text-fg-subtle">Cuenta 4829-1</span>
              </div>
              <div className="grid gap-3 p-3 md:grid-cols-[200px_minmax(0,1fr)_200px]">
                <ul className="hidden flex-col gap-1 md:flex">
                  <li className="text-label pb-1 uppercase text-fg-subtle">Panel líder (BYMA)</li>
                  {preview.map((i) => (
                    <li key={i.symbol} className="flex justify-between rounded bg-surface-high px-2 py-1.5 font-mono text-[11px]">
                      <span className="font-semibold">{i.symbol}</span>
                      <span className={i.changePct >= 0 ? "text-positive" : "text-negative"}>${formatDecimal(i.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-sm font-semibold">
                    GGAL · 24HS <span className="text-positive">+{formatDecimal(ggal.changePct)}%</span>
                  </p>
                  <div className="h-52 rounded-lg bg-surface-lowest p-2">
                    <CandleChart data={priceCandles("landing", ggal.price, 48)} label="Gráfico de ejemplo de GGAL" averages={[{ period: 20, color: "var(--color-primary-strong)" }]} />
                  </div>
                </div>
                <div className="hidden flex-col gap-2 rounded-lg bg-surface-high p-3 md:flex">
                  <span className="text-label uppercase text-fg-subtle">Orden de operación</span>
                  <div className="grid grid-cols-2 gap-1 text-center text-xs font-bold">
                    <span className="rounded bg-positive py-1 text-on-positive">COMPRAR</span>
                    <span className="rounded bg-surface-higher py-1 text-fg-muted">VENDER</span>
                  </div>
                  <span className="text-label text-fg-subtle">Cantidad</span>
                  <span className="rounded bg-surface-lowest px-2 py-1 font-mono text-xs">250</span>
                  <span className="text-label text-fg-subtle">Precio límite</span>
                  <span className="rounded bg-surface-lowest px-2 py-1 font-mono text-xs">$5.420,00</span>
                  <span className="rounded bg-positive py-2 text-center text-xs font-bold text-on-positive">Enviar orden DMA</span>
                </div>
              </div>
            </Card>
            <span className="absolute -top-4 right-28 hidden sm:block">
              <Badge tone="positive" className="bg-surface-higher px-3 py-2 shadow-xl">
                Rendimiento en cartera +28,4% YTD
              </Badge>
            </span>
            <span className="absolute -bottom-4 left-4 hidden sm:block">
              <Badge className="bg-surface-higher px-3 py-2 shadow-xl">Latencia de ejecución &lt; 15 ms a BYMA</Badge>
            </span>
          </div>
        </section>

        <section aria-label="Infraestructura" className="border-y border-surface-high bg-surface-lowest px-4 py-5">
          <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3">
            {["BYMA · Bolsas y Mercados", "CNV · ALyC Propio Nº 942", "Caja de Valores · Custodia 100%", "Matba Rofex · Futuros", "FIX 4.4 · Conectividad API"].map((t) => (
              <li key={t}>
                <Badge className="px-3 py-1.5 text-[11px]">{t}</Badge>
              </li>
            ))}
          </ul>
        </section>

        <section id="caracteristicas" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16">
          <p className="text-label uppercase text-primary">Tecnología institucional</p>
          <h2 className="pt-1 text-3xl font-bold tracking-[-0.8px]">Diseñado para traders que exigen precisión</h2>
          <p className="max-w-2xl pt-2 text-sm text-fg-muted">Herramientas que antes estaban reservadas para mesas de dinero, ahora disponibles en tu computadora o celular.</p>
          <div className="grid gap-4 pt-8 md:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="flex flex-col gap-3 p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-strong/15 text-primary">
                  <MsIcon name={f.icon} size={22} />
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-fg-muted">{f.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-28 bg-surface-lowest px-4 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-label uppercase text-primary">Fácil y seguro</p>
            <h2 className="pt-1 text-3xl font-bold tracking-[-0.8px]">Empezá a operar en 3 simples pasos</h2>
            <div className="grid gap-4 pt-8 text-left md:grid-cols-3">
              {steps.map(([title, text, note], i) => (
                <Card key={title} className="flex flex-col gap-3 p-5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-strong font-mono font-bold text-on-primary">{i + 1}</span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-fg-muted">{text}</p>
                  <p className="text-label flex items-center gap-1 text-positive">
                    <MsIcon name="check_circle" size={12} /> {note}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="comisiones" className="mx-auto max-w-5xl scroll-mt-28 px-4 py-16">
          <div className="text-center">
            <p className="text-label uppercase text-primary">Estructura arancelaria</p>
            <h2 className="pt-1 text-3xl font-bold tracking-[-0.8px]">Comisiones claras y sin letra chica</h2>
            <p className="pt-2 text-sm text-fg-muted">Sin costo de apertura, sin comisiones de custodia ni sorpresas de mantenimiento.</p>
          </div>
          <Card className="mt-8 overflow-x-auto p-2">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-label uppercase text-fg-subtle">
                  <th className="px-3 py-3 font-semibold">Concepto de operatoria</th>
                  <th className="px-3 py-3 text-right font-semibold">Comisión Nodo</th>
                  <th className="px-3 py-3 font-semibold">Plazo / modalidad</th>
                  <th className="px-3 py-3 text-right font-semibold">Detalle regulatorio</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(([concept, fee, term, detail]) => (
                  <tr key={concept} className="border-t border-surface-high">
                    <td className="px-3 py-3">{concept}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-positive">{fee}</td>
                    <td className="px-3 py-3 text-xs text-fg-subtle">{term}</td>
                    <td className="px-3 py-3 text-right text-xs text-fg-subtle">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="pt-3 text-center text-xs text-fg-subtle">* Aranceles de ejemplo más IVA. Los derechos de mercado los fija BYMA y la CNV.</p>
        </section>

        <section id="faq" className="mx-auto max-w-2xl scroll-mt-28 px-4 pb-16">
          <h2 className="text-center text-3xl font-bold tracking-[-0.8px]">Preguntas frecuentes</h2>
          <div className="flex flex-col gap-2 pt-8">
            {faqs.map(([q, a]) => (
              <details key={q} className="group rounded-xl bg-surface p-4 open:bg-surface-high">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
                  {q}
                  <MsIcon name="keyboard_arrow_down" size={18} className="shrink-0 transition group-open:rotate-180" />
                </summary>
                <p className="pt-2 text-sm text-fg-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16">
          <Card className="relative mx-auto max-w-4xl overflow-hidden p-10 text-center">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary-strong/20 via-transparent to-positive/10" />
            <div className="relative flex flex-col items-center gap-4">
              <Badge tone="positive" className="uppercase">DMA FIX 4.4 · Disponible</Badge>
              <h2 className="text-3xl font-bold tracking-[-0.8px]">Unite a la nueva generación de inversores argentinos</h2>
              <p className="max-w-xl text-sm text-fg-muted">Abrí tu cuenta comitente hoy y descubrí el poder de operar con tecnología DMA institucional desde cualquier dispositivo.</p>
              <ButtonLink href="/onboarding" size="lg" iconRight="arrow_forward">
                Abrir cuenta gratis ahora
              </ButtonLink>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-surface-high bg-surface-lowest px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div>
            <p className="text-lg font-bold">Nodo</p>
            <p className="pt-2 text-xs text-fg-subtle">La terminal de trading profesional para el inversor argentino. Conectividad directa a BYMA, CEDEARs globales y liquidación garantizada.</p>
          </div>
          {[
            ["Plataforma", [["Terminal DMA", "/login"], ["Gráficos", "/login"], ["Diario IA", "/login"], ["Abrir cuenta", "/onboarding"]]],
            ["Mercados", [["Acciones BYMA", "/login"], ["CEDEARs", "/login"], ["Bonos soberanos", "/login"], ["Dólar MEP", "/login"]]],
            ["Soporte & legal", [["Comisiones", "#comisiones"], ["Preguntas frecuentes", "#faq"], ["Portal staff (demo)", "/admin"]]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <p className="text-label uppercase text-fg-subtle">{title as string}</p>
              <ul className="flex flex-col gap-1.5 pt-2 text-sm text-fg-muted">
                {(links as string[][]).map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-fg">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl border-t border-surface-high pt-6 mt-8 text-[11px] text-fg-subtle">
          Nodo S.A. es un Agente de Liquidación y Compensación Propio (ALyC Nº 942, demo). Invertir en el mercado de capitales implica
          riesgos. © 2025 Nodo S.A. · Prototipo, datos de ejemplo.
        </p>
      </footer>
    </div>
  );
}
