"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

/** Painel inferior (bottom sheet) modal, adequado a telemóvel. */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="animate-fade-in absolute inset-0 bg-sage-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-sheet-in relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-beige-50 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-beige-300" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-display text-xl font-semibold text-sage-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-sage-600 hover:bg-beige-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-beige-300 bg-white px-3.5 py-3 text-base text-ink placeholder:text-sage-400 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 focus:outline-none";

export const labelClass = "mb-1.5 block text-sm font-medium text-sage-700";
