import { X } from "lucide-react";
import { dismissMessage, useSyncStatus, type SyncMode } from "./shims/store-db";

const LABELS: Record<SyncMode, { text: string; dot: string }> = {
  connecting: { text: "A ligar à lista partilhada…", dot: "bg-beige-400" },
  shared: { text: "Lista partilhada · atualiza em tempo real", dot: "bg-sage-500" },
  readonly: { text: "Lista partilhada · só leitura", dot: "bg-beige-400" },
  local: { text: "Lista guardada só neste dispositivo", dot: "bg-beige-400" },
  error: { text: "Sem ligação à lista partilhada", dot: "bg-danger" },
};

export function SyncBadge() {
  const { mode, message } = useSyncStatus();
  const label = LABELS[mode];
  return (
    <div className="mb-4 space-y-2">
      <p
        role="status"
        data-testid="sync-status"
        data-mode={mode}
        className="inline-flex items-center gap-2 rounded-full border border-beige-200 bg-white px-3 py-1.5 text-xs font-medium text-sage-700"
      >
        <span className={`h-2 w-2 rounded-full ${label.dot}`} aria-hidden="true" />
        {label.text}
      </p>
      {message && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <span className="flex-1">{message}</span>
          <button type="button" onClick={dismissMessage} aria-label="Fechar aviso" className="-m-1 p-1">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
