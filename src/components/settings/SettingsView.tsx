"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldCls, Switch } from "@/components/ui/Dialog";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel } from "@/components/ui/Page";
import { useToast } from "@/components/ui/Toast";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { resetDemoStore } from "@/lib/store/local-store";
import { useSettingsStore } from "@/lib/store/hooks";
import type { DemoSettings } from "@/lib/store/demo-data";

const SECTIONS: { id: string; label: string; icon: MsIconName }[] = [
  { id: "perfil", label: "Perfil", icon: "person" },
  { id: "seguridad", label: "Seguridad", icon: "shield_lock" },
  { id: "notificaciones", label: "Notificaciones", icon: "notifications_active" },
  { id: "preferencias", label: "Preferencias", icon: "settings" },
  { id: "inversor", label: "Perfil de inversor", icon: "psychology" },
  { id: "demo", label: "Datos de la demo", icon: "refresh" },
];

function Row({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-high p-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {text && <p className="text-xs text-fg-subtle">{text}</p>}
      </div>
      {children}
    </div>
  );
}

function ProfileSection() {
  const toast = useToast();
  const [settings, setSettings] = useSettingsStore();
  // Sin borrador se muestra lo guardado (que se carga después de hidratar).
  const [draft, setForm] = useState<DemoSettings["profile"] | null>(null);
  const form = draft ?? settings.profile;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const dirty = JSON.stringify(form) !== JSON.stringify(settings.profile);
  return (
    <Panel title="Datos personales" subtitle="Nombre, contacto y domicilio fiscal (CUIT 20-38492039-4)">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre y apellido">
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={fieldCls} />
        </Field>
        <Field label="Correo electrónico" error={emailOk ? null : "Correo inválido"}>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldCls} />
        </Field>
        <Field label="Teléfono">
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldCls} />
        </Field>
        <Field label="Domicilio">
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fieldCls} />
        </Field>
      </div>
      <div className="flex gap-2 pt-3">
        <Button
          icon="save"
          disabled={!dirty || !emailOk || form.fullName.trim().length < 3}
          onClick={() => {
            setSettings((s) => ({ ...s, profile: { ...form, fullName: form.fullName.trim() } }));
            setForm(null);
            toast({ title: "Perfil actualizado", text: "El nombre se ve también en la barra superior." });
          }}
        >
          Guardar cambios
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setForm(null)}>
            Descartar
          </Button>
        )}
      </div>
    </Panel>
  );
}

const DEVICES = [
  { id: "d1", name: "MacBook Pro · Safari", place: "Rosario, AR", when: "Sesión actual", current: true },
  { id: "d2", name: "iPhone 15 · App Nodo", place: "Rosario, AR", when: "Hace 2 horas" },
  { id: "d3", name: "Windows · Chrome", place: "CABA, AR", when: "Hace 6 días" },
];

function SecuritySection() {
  const toast = useToast();
  const [settings, setSettings] = useSettingsStore();
  const [devices, setDevices] = useState(DEVICES);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [tried, setTried] = useState(false);
  const errors = {
    current: pw.current ? null : "Ingresá tu contraseña actual.",
    next: pw.next.length >= 8 && /\d/.test(pw.next) && /[A-Za-z]/.test(pw.next) ? null : "Mínimo 8 caracteres, con letras y números.",
    confirm: pw.confirm === pw.next ? null : "Las contraseñas no coinciden.",
  };

  function changePassword() {
    setTried(true);
    if (errors.current || errors.next || errors.confirm) return;
    setPw({ current: "", next: "", confirm: "" });
    setTried(false);
    toast({ title: "Contraseña actualizada", text: "Cerramos la sesión en tus otros dispositivos." });
    setDevices((d) => d.filter((x) => x.current));
  }

  return (
    <Panel title="Seguridad" subtitle="Verificación en dos pasos, contraseña y dispositivos">
      <div className="flex flex-col gap-3">
        <Row title="Verificación en dos pasos (2FA)" text="Pide un token de 6 dígitos al iniciar sesión y al retirar fondos.">
          <Switch
            label="Verificación en dos pasos"
            checked={settings.twoFactor}
            onChange={(v) => {
              if (!v && !window.confirm("Desactivar 2FA hace tu cuenta menos segura. ¿Continuar?")) return;
              setSettings((s) => ({ ...s, twoFactor: v }));
              toast({ title: v ? "2FA activado" : "2FA desactivado", tone: v ? "positive" : "negative" });
            }}
          />
        </Row>
        <div className="rounded-lg bg-surface-high p-3">
          <p className="pb-2 text-sm font-semibold">Cambiar contraseña</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Actual" error={tried ? errors.current : null}>
              <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={fieldCls} />
            </Field>
            <Field label="Nueva" error={tried ? errors.next : null}>
              <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={fieldCls} />
            </Field>
            <Field label="Repetir nueva" error={tried ? errors.confirm : null}>
              <input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={fieldCls} />
            </Field>
          </div>
          <Button size="sm" className="mt-3" icon="lock" onClick={changePassword}>
            Actualizar contraseña
          </Button>
        </div>
        <div>
          <p className="text-label pb-1 uppercase text-fg-subtle">Dispositivos con sesión activa</p>
          <ul className="flex flex-col gap-1">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-high px-3 py-2 text-xs">
                <span>
                  <span className="block font-semibold">{d.name}</span>
                  <span className="text-fg-subtle">
                    {d.place} · {d.when}
                  </span>
                </span>
                {d.current ? (
                  <Badge tone="positive">Este dispositivo</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setDevices((list) => list.filter((x) => x.id !== d.id));
                      toast({ title: "Sesión cerrada", text: d.name, tone: "neutral" });
                    }}
                  >
                    Cerrar sesión
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

const NOTIFY: { key: keyof DemoSettings["notify"]; title: string; text: string }[] = [
  { key: "fills", title: "Ejecución de órdenes", text: "Cuando se ejecuta una orden, un stop o un target." },
  { key: "deposits", title: "Depósitos y retiros", text: "Acreditaciones y transferencias salientes." },
  { key: "priceAlerts", title: "Alertas de precio", text: "Las que configurás en Cotizaciones." },
  { key: "news", title: "Novedades y análisis", text: "Informes de mercado de Nova." },
];
const CHANNELS: { key: keyof DemoSettings["notify"]; title: string }[] = [
  { key: "channelEmail", title: "Correo electrónico" },
  { key: "channelWhatsapp", title: "WhatsApp" },
  { key: "channelPush", title: "Notificaciones push" },
];

function NotificationsSection() {
  const toast = useToast();
  const [settings, setSettings] = useSettingsStore();
  const set = (key: keyof DemoSettings["notify"], v: boolean) => {
    setSettings((s) => ({ ...s, notify: { ...s.notify, [key]: v } }));
    toast({ title: "Preferencia guardada", tone: "neutral" });
  };
  return (
    <Panel title="Notificaciones" subtitle="Qué te avisamos y por dónde">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          {NOTIFY.map((n) => (
            <Row key={n.key} title={n.title} text={n.text}>
              <Switch label={n.title} checked={settings.notify[n.key]} onChange={(v) => set(n.key, v)} />
            </Row>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase text-fg-subtle">Canales</p>
          {CHANNELS.map((c) => (
            <Row key={c.key} title={c.title}>
              <Switch label={c.title} checked={settings.notify[c.key]} onChange={(v) => set(c.key, v)} />
            </Row>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function PreferencesSection() {
  const [settings, setSettings] = useSettingsStore();
  return (
    <Panel title="Preferencias" subtitle="Apariencia y comportamiento de la boleta">
      <div className="flex flex-col gap-2">
        <Row title="Tema" text="También se cambia desde la luna de la barra superior.">
          <select value={settings.theme} onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value as DemoSettings["theme"] }))} className={`${fieldCls} w-36`}>
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
          </select>
        </Row>
        <Row title="Moneda de visualización" text="Para los montos del dashboard.">
          <select value={settings.currency} onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value as DemoSettings["currency"] }))} className={`${fieldCls} w-36`}>
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD MEP)</option>
          </select>
        </Row>
        <Row title="Horario de rueda" text="Real: BYMA opera de lunes a viernes de 11 a 17 hs (hora argentina). Demostración: la rueda queda siempre abierta.">
          <select value={settings.sessionMode} onChange={(e) => setSettings((s) => ({ ...s, sessionMode: e.target.value as DemoSettings["sessionMode"] }))} className={`${fieldCls} w-40`}>
            <option value="real">Horario real</option>
            <option value="always">Siempre abierta (demo)</option>
          </select>
        </Row>
        <Row title="Confirmar antes de enviar órdenes" text="Valor inicial del check en la boleta.">
          <Switch label="Confirmar órdenes" checked={settings.confirmOrders} onChange={(v) => setSettings((s) => ({ ...s, confirmOrders: v }))} />
        </Row>
      </div>
    </Panel>
  );
}

const QUESTIONS = [
  { q: "¿Cuál es tu horizonte de inversión?", a: ["Menos de 1 año", "1 a 3 años", "Más de 3 años"] },
  { q: "Si tu cartera cae 20% en un mes, ¿qué hacés?", a: ["Vendo para no perder más", "Espero a que se recupere", "Compro más aprovechando la baja"] },
  { q: "¿Qué experiencia tenés operando?", a: ["Ninguna o plazo fijo", "Fondos comunes y bonos", "Acciones, CEDEARs y opciones"] },
];
const PROFILE_OF = ["Conservador", "Moderado", "Agresivo"] as const;

function InvestorSection() {
  const toast = useToast();
  const [settings, setSettings] = useSettingsStore();
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const done = answers.every((a) => a !== null);
  const score = answers.reduce<number>((a, b) => a + (b ?? 0), 0);
  const result = PROFILE_OF[score <= 1 ? 0 : score <= 4 ? 1 : 2];

  return (
    <Panel title="Perfil de inversor" subtitle="Test de idoneidad (CNV RG 731)" actions={settings.riskProfile && <Badge tone="primary">Actual: {settings.riskProfile}</Badge>}>
      <div className="flex flex-col gap-3">
        {QUESTIONS.map((q, qi) => (
          <fieldset key={q.q} className="rounded-lg bg-surface-high p-3">
            <legend className="sr-only">{q.q}</legend>
            <p className="pb-2 text-sm font-semibold">
              {qi + 1}. {q.q}
            </p>
            <div className="grid gap-1 sm:grid-cols-3">
              {q.a.map((a, ai) => (
                <label key={a} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${answers[qi] === ai ? "bg-primary-strong/20 text-fg" : "text-fg-muted hover:bg-surface-higher"}`}>
                  <input type="radio" name={`q${qi}`} checked={answers[qi] === ai} onChange={() => setAnswers((prev) => prev.map((x, i) => (i === qi ? ai : x)))} className="accent-primary-strong" />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            icon="check"
            disabled={!done}
            onClick={() => {
              setSettings((s) => ({ ...s, riskProfile: result }));
              toast({ title: `Tu perfil es ${result}`, text: "Quedó registrado en tu legajo." });
            }}
          >
            Guardar resultado
          </Button>
          {done && <span className="text-sm">Resultado: <strong>{result}</strong></span>}
        </div>
      </div>
    </Panel>
  );
}

function DemoSection() {
  const toast = useToast();
  return (
    <Panel title="Datos de la demo" subtitle="Todo lo que hacés se guarda solo en este navegador">
      <div className="flex flex-col gap-3 text-xs text-fg-muted">
        <p>
          Órdenes, movimientos, cuentas vinculadas, tickets, alertas, dibujos del gráfico y ajustes se guardan en el almacenamiento local. Reiniciar borra todo y vuelve a los datos de ejemplo
          (también los cambios hechos desde la vista staff).
        </p>
        <Button
          variant="danger"
          icon="refresh"
          className="self-start"
          onClick={() => {
            if (!window.confirm("¿Borrar todos los datos de la demo y volver al estado inicial?")) return;
            resetDemoStore();
            toast({ title: "Demo reiniciada", text: "Volviste a los datos de ejemplo." });
          }}
        >
          Reiniciar datos de la demo
        </Button>
      </div>
    </Panel>
  );
}

export function SettingsView() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Secciones de ajustes" className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:self-start">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs text-fg-muted hover:bg-surface hover:text-fg">
            <MsIcon name={s.icon} size={16} />
            {s.label}
          </a>
        ))}
      </nav>
      <div className="flex min-w-0 flex-col gap-4">
        {[ProfileSection, SecuritySection, NotificationsSection, PreferencesSection, InvestorSection, DemoSection].map((S, i) => (
          <section key={SECTIONS[i].id} id={SECTIONS[i].id} className="scroll-mt-20">
            <S />
          </section>
        ))}
      </div>
    </div>
  );
}
