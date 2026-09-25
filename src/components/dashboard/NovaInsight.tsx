import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatDecimal, formatInteger } from "@/lib/format";
import { caucion } from "@/lib/mock-data";

/** Texto fijo del Figma. Cuando exista el motor de insights, recibirlo por props. */
export function NovaInsight() {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-surface-high to-surface p-3">
      <div aria-hidden className="absolute -top-8 -right-8 size-28 rounded-full bg-primary/20 blur-[24px]" />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
            <Icon name="icon-sparkles" width={19} height={19} />
            Insight de Nova
          </h2>
          <Badge tone="primary" pill className="bg-primary/20 px-2 uppercase">
            Alerta IA
          </Badge>
        </div>
        <p className="text-xs leading-[19.5px] text-fg-muted">
          Detectamos una concentración del <strong className="font-bold text-fg">38%</strong> de tu cartera en el sector
          financiero y tecnológico con beta de <span className="font-mono text-primary">1,15</span>. Tu correlación con el
          CCL amortiguó la volatilidad local en las últimas 72hs.
        </p>
        <p className="flex items-center gap-1 rounded-lg bg-surface-lowest/80 p-1 font-mono text-[10px] leading-[14px] text-fg">
          <Icon name="icon-check-circle" width={17} height={16} />
          Sugerencia: Diversificar en ONs hard dollar (YMCIO / YCA6O).
        </p>
      </div>
      <button
        type="button"
        className="relative mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-primary-strong px-3 py-2 text-xs font-semibold text-on-primary hover:opacity-90"
      >
        Explorar ONs recomendadas
        <Icon name="icon-arrow-right-dark" width={11} height={11} />
      </button>
    </Card>
  );
}

export function CaucionCard() {
  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold">
          <Icon name="icon-wallet" width={15} height={14} />
          Caución Colocadora
        </h2>
        <span className="text-label text-positive">TNA {formatDecimal(caucion.tna)}%</span>
      </div>
      <p className="text-xs text-fg-subtle">Rentabilizá tus pesos no invertidos a 1 día hábil de forma automática.</p>
      <div className="flex items-center justify-between pt-1">
        <p className="text-label text-fg">Disponible para colocar: ${formatInteger(caucion.availableToPlace)}</p>
        <button type="button" className="text-label rounded bg-surface-higher px-2 py-1 text-fg hover:bg-surface-highest">
          Colocar T+1
        </button>
      </div>
    </Card>
  );
}
