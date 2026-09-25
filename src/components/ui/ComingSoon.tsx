import { Card } from "./Card";
import { MsIcon } from "./MsIcon";
import { ButtonLink } from "./Button";
import type { MsIconName } from "./ms-icon-names";

interface ComingSoonProps {
  icon: MsIconName;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}

/** Secciones de la navegación que todavía no tienen diseño en el Figma. */
export function ComingSoon({ icon, title, description, backHref, backLabel }: ComingSoonProps) {
  return (
    <Card className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <MsIcon name={icon} size={24} />
      </span>
      <span className="text-label rounded bg-surface-higher px-2 py-0.5 uppercase text-fg-subtle">Próximamente</span>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-fg-muted">{description}</p>
      <ButtonLink href={backHref} variant="secondary" icon="arrow_back">
        {backLabel}
      </ButtonLink>
    </Card>
  );
}
