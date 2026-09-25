"use client";

import { MsIcon } from "@/components/ui/MsIcon";
import { StatusDot } from "@/components/ui/Badge";
import { useMarket, type FeedSpeed } from "./MarketProvider";

/** Pausa y velocidad del feed simulado: acelerarlo sirve para ver stops y targets en acción. */
export function FeedControls() {
  const { paused, setPaused, speed, setSpeed, lastTick } = useMarket();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-label flex items-center gap-1 text-fg-subtle">
        <StatusDot tone={paused ? "neutral" : "positive"} /> {paused ? "Feed en pausa" : `Feed en vivo${lastTick ? ` · ${lastTick}` : ""}`}
      </span>
      <button
        type="button"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? "Reanudar feed" : "Pausar feed"}
        className="rounded bg-surface-high p-1 text-fg-muted hover:text-fg"
      >
        <MsIcon name={paused ? "play_circle" : "pause_circle"} size={16} />
      </button>
      <div role="group" aria-label="Velocidad del feed" className="flex rounded bg-surface-high p-0.5">
        {([1, 5, 20] as FeedSpeed[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={speed === s}
            onClick={() => setSpeed(s)}
            className={`text-label rounded px-1.5 py-0.5 ${speed === s ? "bg-primary-strong text-on-primary" : "text-fg-muted"}`}
          >
            x{s}
          </button>
        ))}
      </div>
    </div>
  );
}
