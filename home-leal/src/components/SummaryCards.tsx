import { formatEuro } from "@/lib/format";
import type { Summary } from "@/lib/totals";

export function SummaryCards({ summary }: { summary: Summary }) {
  const total = summary.pendingCount + summary.boughtCount;
  const progress = total === 0 ? 0 : Math.round((summary.boughtCount / total) * 100);

  return (
    <section aria-label="Resumo" className="space-y-3">
      <div className="rounded-3xl bg-sage-600 p-5 text-white shadow-sm">
        <p className="text-sm text-sage-100">Custo estimado da lista</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight" data-testid="estimated-total">
          {formatEuro(summary.estimatedTotal)}
        </p>
        <p className="mt-1 text-sm text-sage-100">
          Falta comprar: {formatEuro(summary.estimatedPending)}
        </p>
        {summary.pendingWithoutPrice > 0 && (
          <p className="mt-1 text-xs text-sage-200">
            {summary.pendingWithoutPrice} produto(s) pendente(s) sem preço estimado
          </p>
        )}
        <div className="mt-4">
          <div
            className="h-2 overflow-hidden rounded-full bg-sage-800/40"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso das compras"
          >
            <div className="h-full rounded-full bg-beige-100 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-sage-100">{progress}% comprado</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pendentes" value={String(summary.pendingCount)} testId="pending-count" />
        <Stat label="Comprados" value={String(summary.boughtCount)} testId="bought-count" />
        <Stat label="Valor real" value={formatEuro(summary.realTotal)} testId="real-total" />
      </div>
    </section>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded-2xl border border-beige-200 bg-white px-3 py-3.5">
      <p className="text-xs text-sage-600">{label}</p>
      <p className="mt-0.5 truncate text-lg font-semibold text-ink" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}
