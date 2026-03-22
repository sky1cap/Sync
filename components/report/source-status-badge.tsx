import { Badge } from "@/components/ui/badge";
import { SourceState } from "@/lib/types/report";

const content: Record<SourceState, { label: string; variant: "default" | "neutral" | "warning" | "danger" }> = {
  accessible: { label: "Fonte verificata", variant: "default" },
  partially_accessible: { label: "Parzialmente accessibile", variant: "warning" },
  blocked: { label: "Bloccata", variant: "danger" },
  not_provided: { label: "Non fornita", variant: "neutral" },
};

export function SourceStatusBadge({ state }: { state: SourceState }) {
  const item = content[state];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
