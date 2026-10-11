"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { Item } from "@/lib/types";
import { buildWhatsAppMessage, whatsAppShareUrl } from "@/lib/whatsapp";
import { Sheet } from "./Sheet";

export function ShareSheet({ items, onClose }: { items: Item[]; onClose: () => void }) {
  const [includeBought, setIncludeBought] = useState(false);
  const [copied, setCopied] = useState(false);
  const message = buildWhatsAppMessage(items, { includeBought });

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Sheet title="Partilhar lista" onClose={onClose}>
      <div className="space-y-4">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2 text-sm text-sage-700">
          Incluir produtos já comprados
          <input
            type="checkbox"
            checked={includeBought}
            onChange={(e) => setIncludeBought(e.target.checked)}
            className="h-5 w-5 accent-sage-600"
          />
        </label>

        <pre
          aria-label="Pré-visualização da mensagem"
          className="max-h-[40dvh] overflow-y-auto rounded-2xl border border-beige-200 bg-white p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink"
        >
          {message}
        </pre>

        <a
          href={whatsAppShareUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-semibold text-[#0b3d1f] active:brightness-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.82.7 12.08c0 2 .52 3.95 1.52 5.67L.6 23.62l6-1.57a11.33 11.33 0 0 0 5.44 1.39h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04" />
          </svg>
          Enviar pelo WhatsApp
        </a>

        <button
          type="button"
          onClick={copy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-beige-300 bg-white font-medium text-sage-700"
        >
          {copied ? (
            <>
              <Check className="h-4.5 w-4.5" aria-hidden="true" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-4.5 w-4.5" aria-hidden="true" /> Copiar texto
            </>
          )}
        </button>
      </div>
    </Sheet>
  );
}
