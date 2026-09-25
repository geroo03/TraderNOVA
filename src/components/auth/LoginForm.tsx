"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";

type Step = "credentials" | "token";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_LENGTH = 6;

/**
 * Login en dos pasos (credenciales → token 2FA).
 * PROTOTIPO: no hay backend. Ambos pasos validan formato y navegan; el punto
 * de integración real está marcado con TODO en cada submit.
 */
export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");

  return (
    <div className="flex w-full max-w-[448px] flex-col gap-4">
      <StepSwitcher step={step} onChange={setStep} />
      {step === "credentials" ? (
        <CredentialsStep onSuccess={() => setStep("token")} />
      ) : (
        <TokenStep onBack={() => setStep("credentials")} onSuccess={() => router.push("/dashboard")} />
      )}
    </div>
  );
}

function StepSwitcher({ step, onChange }: { step: Step; onChange: (s: Step) => void }) {
  const items: { id: Step; label: string }[] = [
    { id: "credentials", label: "Paso 1: Credenciales" },
    { id: "token", label: "Paso 2: Token 2FA" },
  ];
  return (
    <div className="flex gap-1 rounded-lg bg-surface-high p-1" role="tablist" aria-label="Pasos de ingreso">
      {items.map((item) => {
        const active = item.id === step;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            // Solo se puede volver atrás; el paso 2 se habilita al validar credenciales.
            disabled={item.id === "token" && !active}
            onClick={() => onChange(item.id)}
            className={`flex-1 rounded px-3 py-1.5 font-mono text-xs transition-colors ${
              active
                ? "bg-primary-strong font-semibold text-on-primary-strong"
                : "font-medium text-fg-muted disabled:cursor-not-allowed"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function CredentialsStep({ onSuccess }: { onSuccess: () => void }) {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }
    if (password.length === 0) {
      setError("Ingresá tu contraseña.");
      return;
    }
    setError(null);
    // TODO(auth): enviar { email, password, remember } al backend y avanzar solo si responde OK.
    onSuccess();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 pt-[7.5px]">
      <header className="flex flex-col gap-1">
        <p className="text-label uppercase tracking-[1px] text-primary">Terminal de inversores</p>
        <h1 className="text-2xl font-semibold tracking-[-0.6px]">Ingresá a tu cuenta</h1>
        <p className="text-sm text-fg-muted">
          Accedé a tus órdenes, cotizaciones BYMA en tiempo real y portafolio de CEDEARs.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-label uppercase text-fg-muted">
            Correo electrónico
          </label>
          <div className="relative">
            <Icon name="icon-mail" width={15} height={12} className="pointer-events-none absolute top-[14px] left-[13.5px]" />
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="inversor@nodo.com.ar"
              aria-invalid={error !== null && !EMAIL_PATTERN.test(email.trim())}
              aria-describedby={error ? errorId : undefined}
              className="w-full rounded-lg bg-surface-high py-2.5 pr-3 pl-10 font-mono text-sm font-medium text-fg placeholder:text-fg-subtle"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={passwordId} className="text-label uppercase text-fg-muted">
              Contraseña de operaciones
            </label>
            {/* TODO(auth): apuntar al flujo de recuperación cuando exista. */}
            <a href="#" className="font-mono text-xs font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative">
            <Icon name="icon-lock" width={12} height={16} className="pointer-events-none absolute top-[11.75px] left-[15px]" />
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              aria-describedby={error ? errorId : undefined}
              className="w-full rounded-lg bg-surface-high px-10 py-2.5 font-mono text-sm font-medium tracking-[1.4px] text-fg placeholder:text-fg-subtle"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1"
            >
              <Icon name="icon-eye" width={17} height={12} />
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-fg-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded-[2.5px] accent-primary-strong"
          />
          Recordarme en este dispositivo
        </label>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-negative">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-strong px-4 py-3 text-lg font-semibold text-on-primary shadow-lg transition-opacity hover:opacity-90"
        >
          Iniciar sesión
          <Icon name="icon-arrow-right" width={12} height={12} />
        </button>

        <div className="flex items-center gap-2 rounded-lg bg-surface p-2.5">
          <Icon name="icon-shield-2fa" width={11} height={14} />
          <p className="font-mono text-xs font-medium text-fg-muted">Modo 2FA activo en esta cuenta</p>
        </div>
      </div>

      <p className="pt-3 text-center text-xs text-fg-muted">
        ¿Todavía no tenés cuenta?{" "}
        {/* TODO(onboarding): enlazar a la pantalla "Onboarding - Validación de DNI". */}
        <a href="#" className="font-medium text-primary hover:underline">
          Abrí tu cuenta comitente en 5 min
        </a>
      </p>
    </form>
  );
}

function TokenStep({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const tokenId = useId();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (token.length !== TOKEN_LENGTH) {
      setError(`El token tiene ${TOKEN_LENGTH} dígitos.`);
      return;
    }
    setError(null);
    // TODO(auth): verificar el token contra el backend antes de navegar.
    onSuccess();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4 pt-[7.5px]">
      <header className="flex flex-col gap-1">
        <p className="text-label uppercase tracking-[1px] text-primary">Verificación en dos pasos</p>
        <h1 className="text-2xl font-semibold tracking-[-0.6px]">Ingresá tu token</h1>
        <p className="text-sm text-fg-muted">Abrí tu app autenticadora e ingresá el código de {TOKEN_LENGTH} dígitos.</p>
      </header>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={tokenId} className="text-label uppercase text-fg-muted">
          Token 2FA
        </label>
        <input
          id={tokenId}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={token}
          // Se filtra antes de truncar para que un pegado tipo "123-456" quede completo.
          onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, TOKEN_LENGTH))}
          placeholder="000000"
          aria-describedby={error ? `${tokenId}-error` : undefined}
          className="w-full rounded-lg bg-surface-high px-3 py-2.5 text-center font-mono text-xl font-semibold tracking-[0.5em] text-fg placeholder:text-fg-subtle"
        />
        {error && (
          <p id={`${tokenId}-error`} role="alert" className="text-xs text-negative">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-strong px-4 py-3 text-lg font-semibold text-on-primary shadow-lg transition-opacity hover:opacity-90"
      >
        Verificar e ingresar
        <Icon name="icon-arrow-right" width={12} height={12} />
      </button>
      <button type="button" onClick={onBack} className="font-mono text-xs font-medium text-primary hover:underline">
        ← Volver a credenciales
      </button>
    </form>
  );
}
