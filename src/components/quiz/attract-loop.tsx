"use client";

import * as React from "react";
import { ContourlineMark } from "@/components/brand/contourline-mark";

const MESSAGES = [
  "Bem-vindo ao estande Contourline.",
  "Participe do quiz e concorra ao sorteio.",
  "Siga @contourlinemed e @lumenisoficial.",
];

interface AttractLoopProps {
  onDismiss: () => void;
}

export function AttractLoop({ onDismiss }: AttractLoopProps) {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const i = window.setInterval(
      () => setIdx((v) => (v + 1) % MESSAGES.length),
      4000,
    );
    return () => window.clearInterval(i);
  }, []);

  return (
    <button
      type="button"
      onClick={onDismiss}
      onTouchStart={onDismiss}
      aria-label="Toque para iniciar o quiz"
      className="kiosk-lock fixed inset-0 z-50 flex flex-col items-center justify-center gap-12 bg-[var(--color-navy-900)] px-8 text-center animate-fade-in"
    >
      {/* Símbolo Contourline pulsando — com halo bronze */}
      <div className="relative flex h-48 w-48 items-center justify-center md:h-56 md:w-56">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[var(--color-bronze-500)] animate-attract-pulse"
        />
        <div className="relative animate-pulse-soft">
          <ContourlineMark
            variant="symbol"
            tone="white"
            width={140}
            height={140}
            className="md:!h-40 md:!w-40"
          />
        </div>
      </div>

      {/* Mensagem rotativa */}
      <div className="relative h-20 w-full max-w-2xl overflow-hidden md:h-24">
        <p
          key={idx}
          className="animate-fade-up font-display text-[clamp(1.5rem,3vw+1rem,2.75rem)] leading-[1.1] text-white"
        >
          {MESSAGES[idx]}
        </p>
      </div>

      {/* Call-to-action */}
      <div className="flex items-center gap-5">
        <span className="h-px w-12 bg-[var(--color-bronze-500)]" />
        <span className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--color-bronze-300)]">
          Toque para começar
        </span>
        <span className="h-px w-12 bg-[var(--color-bronze-500)]" />
      </div>

      {/* Indicador discreto de localização/evento */}
      <div className="absolute bottom-8 left-0 right-0 text-[10px] uppercase tracking-[0.3em] text-[var(--color-navy-300)]">
        CBCD 2026 · Goiânia
      </div>
    </button>
  );
}
