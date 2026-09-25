"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DniUpload, type UploadedFile } from "./DniUpload";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import type { MsIconName } from "@/components/ui/ms-icon-names";

const STEPS = ["Datos personales", "Validación DNI", "Selfie biométrica", "Perfil inversor", "Firma & términos"] as const;

const TIPS: { icon: MsIconName; title: string; text: string }[] = [
  { icon: "flare", title: "Evitá reflejos", text: "Sin flash sobre el código PDF417" },
  { icon: "crop_free", title: "Encuadre total", text: "Los 4 bordes de la tarjeta visibles" },
  { icon: "light_mode", title: "Iluminación neutra", text: "Luz natural, fondo liso" },
];

const PROFILES: { icon: MsIconName; title: string; text: string }[] = [
  { icon: "savings", title: "Conservador", text: "Vendería para no perder más. Priorizo preservar capital." },
  { icon: "balance", title: "Moderado", text: "Esperaría a que se recupere. Acepto algo de volatilidad." },
  { icon: "rocket_launch", title: "Agresivo", text: "Compraría más aprovechando la baja. Busco crecimiento." },
];

const inputCls = "w-full rounded-lg bg-surface-high px-3 py-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-primary";

interface Personal {
  firstName: string;
  lastName: string;
  cuit: string;
  email: string;
  phone: string;
}

const CUIT_RE = /^\d{2}-?\d{8}-?\d$/;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label uppercase text-fg-subtle">{label}</span>
      {children}
    </label>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1); // índice 0-based; arranca en "Validación DNI" como el Figma
  const [personal, setPersonal] = useState<Personal>({ firstName: "Facundo", lastName: "Rossi", cuit: "20-38492039-4", email: "facundo@ejemplo.com", phone: "+54 9 11 5555-0000" });
  const [back, setBack] = useState<UploadedFile | null>(null);
  const [selfie, setSelfie] = useState<"idle" | "capturing" | "done">("idle");
  const [profile, setProfile] = useState<string | null>(null);
  const [terms, setTerms] = useState({ tyc: false, pep: false, fatca: false });

  const personalValid = personal.firstName.trim() && personal.lastName.trim() && CUIT_RE.test(personal.cuit) && /\S+@\S+\.\S+/.test(personal.email);
  const canContinue = [personalValid, back !== null, selfie === "done", profile !== null, terms.tyc && terms.pep && terms.fatca][step];
  const progress = Math.round(((step + (canContinue ? 1 : 0)) / STEPS.length) * 100);

  function next() {
    if (!canContinue) return;
    if (step === STEPS.length - 1) router.push("/dashboard");
    else setStep(step + 1);
  }

  const requirements: { label: string; hint: string; state: "ok" | "pending" | "progress" }[] = [
    { label: "DNI tarjeta vigente", hint: "No vencido ni en trámite", state: "ok" },
    { label: "Frente nítido y legible", hint: "Datos personales extraídos por OCR", state: "ok" },
    { label: "Dorso con código legible", hint: "Código PDF417 escaneable", state: back ? "ok" : "pending" },
    { label: "Sin reflejos ni sombras", hint: "Análisis de luminancia automático", state: back ? "ok" : "progress" },
    { label: "Bordes completos visibles", hint: "Los 4 bordes de la tarjeta", state: back ? "ok" : "progress" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-label uppercase text-fg-subtle">
            Apertura comitente · Paso {step + 1} de {STEPS.length} — {progress}% completado
          </p>
          <span className="text-label flex items-center gap-1 text-positive">
            <StatusDot /> Conexión cifrada Renaper en vivo
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-high" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary-strong transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  aria-current={current ? "step" : undefined}
                  className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs ${current ? "bg-primary-strong/15 text-primary" : done ? "text-positive" : "text-fg-subtle"}`}
                >
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${done ? "bg-positive text-on-positive" : current ? "bg-primary-strong text-on-primary" : "bg-surface-higher"}`}>
                    {done ? <MsIcon name="check" size={14} /> : i + 1}
                  </span>
                  <span>
                    <span className="block text-[10px] uppercase">{done ? "Completado" : current ? "En curso" : "Pendiente"}</span>
                    {s}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      {step === 0 && (
        <Card className="flex flex-col gap-4 p-5">
          <h1 className="text-2xl font-bold">Contanos quién sos</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input className={inputCls} value={personal.firstName} onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })} autoComplete="given-name" />
            </Field>
            <Field label="Apellido">
              <input className={inputCls} value={personal.lastName} onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })} autoComplete="family-name" />
            </Field>
            <Field label="CUIT / CUIL">
              <input className={`${inputCls} font-mono`} value={personal.cuit} onChange={(e) => setPersonal({ ...personal, cuit: e.target.value })} placeholder="20-12345678-9" aria-invalid={!CUIT_RE.test(personal.cuit)} />
            </Field>
            <Field label="Correo electrónico">
              <input type="email" className={inputCls} value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} autoComplete="email" />
            </Field>
            <Field label="Celular">
              <input type="tel" className={inputCls} value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} autoComplete="tel" />
            </Field>
          </div>
          {!personalValid && <p className="text-xs text-negative">Completá nombre, apellido, un CUIT válido (11 dígitos) y un correo.</p>}
        </Card>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-label uppercase text-fg-subtle">Identificación obligatoria CNV · UIF</p>
              <h1 className="text-2xl font-bold tracking-[-0.6px] sm:text-3xl">Subí las fotos de tu DNI argentino</h1>
              <p className="pt-1 text-sm text-fg-muted">
                Necesitamos verificar tu identidad ante la Comisión Nacional de Valores (CNV) y Renaper. Las fotos deben ser nítidas, legibles y con luz uniforme.
              </p>
            </div>
            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold">
                  <StatusDot /> DNI frente <Badge tone="positive">Cargado con éxito</Badge>
                </h2>
              </div>
              <div className="grid gap-4 rounded-xl bg-gradient-to-br from-[#2a3548] to-[#1b2230] p-4 sm:grid-cols-[120px_1fr]">
                <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-surface-highest text-fg-subtle">
                  <MsIcon name="person" size={48} />
                </div>
                <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="col-span-2 text-[10px] tracking-widest text-fg-subtle uppercase">República Argentina · Documento Nacional de Identidad</div>
                  {[
                    ["Apellido", personal.lastName.toUpperCase()],
                    ["Nombre", personal.firstName.toUpperCase()],
                    ["Documento", personal.cuit.replace(/\D/g, "").slice(2, 10).replace(/\B(?=(\d{3})+(?!\d))/g, ".")],
                    ["Sexo", "M"],
                    ["Nacionalidad", "ARGENTINA"],
                    ["Emisión", "14/08/2019"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[10px] text-fg-subtle">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="text-label flex items-center gap-1 text-positive">
                <MsIcon name="verified" size={12} /> Datos extraídos por OCR Renaper con coincidencia 99,4% (simulado)
              </p>
            </Card>
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="flex items-center gap-2 font-semibold">
                <StatusDot tone={back ? "positive" : "negative"} /> DNI dorso {!back && <Badge tone="negative">Requerido ahora</Badge>}
              </h2>
              <DniUpload onChange={setBack} />
              <ul className="grid gap-2 text-xs text-fg-subtle sm:grid-cols-3">
                {TIPS.map(({ icon, title: t, text: d }) => (
                  <li key={t} className="flex gap-2">
                    <MsIcon name={icon} size={16} className="text-primary" />
                    <span>
                      <span className="block font-semibold text-fg">{t}</span>
                      {d}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3 p-4">
              <h2 className="font-semibold">Requisitos de validación</h2>
              <ul className="flex flex-col gap-2">
                {requirements.map((r) => (
                  <li key={r.label} className="flex items-start justify-between gap-2 text-xs">
                    <span className="flex gap-2">
                      <MsIcon
                        name={r.state === "ok" ? "check_circle" : r.state === "pending" ? "error" : "pending"}
                        size={16}
                        className={r.state === "ok" ? "text-positive" : r.state === "pending" ? "text-negative" : "text-fg-subtle"}
                      />
                      <span>
                        <span className="block font-semibold">{r.label}</span>
                        <span className="text-fg-subtle">{r.hint}</span>
                      </span>
                    </span>
                    <span className={`text-label ${r.state === "ok" ? "text-positive" : r.state === "pending" ? "text-negative" : "text-fg-subtle"}`}>
                      {r.state === "ok" ? "Verificado" : r.state === "pending" ? "Pendiente" : "En cola"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="flex gap-3 p-4">
              <MsIcon name="shield_lock" size={22} className="text-positive" />
              <div className="text-xs text-fg-muted">
                <p className="pb-1 text-sm font-semibold text-fg">Seguridad de grado institucional</p>
                Tus datos viajan cifrados y se validan contra Renaper. Cumplimos la Ley 25.326 de Protección de Datos Personales y las resoluciones de la CNV.
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-fg text-bg">
                <MsIcon name="qr_code_2" size={40} />
              </span>
              <p className="text-xs text-fg-muted">
                <span className="block text-sm font-semibold text-fg">¿Preferís usar tu teléfono?</span>
                Escaneá con la cámara de tu celular para subir la foto directamente desde ahí.
              </p>
            </Card>
          </div>
        </div>
      )}

      {step === 2 && (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold">Selfie biométrica</h1>
          <p className="max-w-md text-sm text-fg-muted">Mirá a la cámara con buena luz. Vamos a comparar tu rostro con la foto del DNI (prueba de vida simulada, no se usa la cámara).</p>
          <div className={`flex size-48 items-center justify-center rounded-full border-4 ${selfie === "done" ? "border-positive" : "border-dashed border-primary"}`}>
            <MsIcon name={selfie === "done" ? "check_circle" : "face"} size={72} className={selfie === "done" ? "text-positive" : "text-primary"} />
          </div>
          {selfie === "done" ? (
            <Badge tone="positive">Coincidencia biométrica 98,7%</Badge>
          ) : (
            <Button
              icon="photo_camera"
              disabled={selfie === "capturing"}
              onClick={() => {
                setSelfie("capturing");
                setTimeout(() => setSelfie("done"), 1200);
              }}
            >
              {selfie === "capturing" ? "Analizando…" : "Tomar selfie"}
            </Button>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="flex flex-col gap-4 p-5">
          <h1 className="text-2xl font-bold">Perfil de inversor</h1>
          <p className="text-sm text-fg-muted">¿Cómo reaccionarías si tu cartera cae un 20% en un mes?</p>
          <div className="grid gap-3 md:grid-cols-3">
            {PROFILES.map(({ title, text, icon }) => (
              <button
                key={title}
                type="button"
                aria-pressed={profile === title}
                onClick={() => setProfile(title)}
                className={`flex flex-col gap-2 rounded-xl p-4 text-left transition ${profile === title ? "bg-primary-strong/20 ring-2 ring-primary" : "bg-surface-high hover:bg-surface-higher"}`}
              >
                <MsIcon name={icon} size={24} className="text-primary" />
                <span className="font-semibold">{title}</span>
                <span className="text-xs text-fg-muted">{text}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="flex flex-col gap-4 p-5">
          <h1 className="text-2xl font-bold">Firma y términos</h1>
          <p className="text-sm text-fg-muted">Revisá y aceptá las declaraciones obligatorias para abrir tu cuenta comitente.</p>
          {(
            [
              ["tyc", "Acepto los Términos y Condiciones y el Reglamento de Gestión de Nodo (demo)."],
              ["pep", "Declaro bajo juramento que no soy Persona Expuesta Políticamente (PEP)."],
              ["fatca", "Declaro que no soy residente fiscal en EE.UU. (FATCA)."],
            ] as [keyof typeof terms, string][]
          ).map(([k, text]) => (
            <label key={k} className="flex items-start gap-3 rounded-lg bg-surface-high p-3 text-sm">
              <input type="checkbox" checked={terms[k]} onChange={(e) => setTerms({ ...terms, [k]: e.target.checked })} className="mt-1 accent-primary-strong" />
              {text}
            </label>
          ))}
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="secondary" icon="arrow_back" onClick={() => setStep(step - 1)}>
            Volver a {STEPS[step - 1].toLowerCase()}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-fg-subtle hover:text-fg">
            Guardar y continuar más tarde
          </Link>
          <Button onClick={next} disabled={!canContinue} iconRight="arrow_forward">
            {step === STEPS.length - 1 ? "Finalizar y entrar" : `Continuar a ${STEPS[step + 1].toLowerCase()}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
