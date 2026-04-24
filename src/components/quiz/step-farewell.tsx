"use client";

import * as React from "react";
import { ContourlineMark } from "@/components/brand/contourline-mark";
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/lib/quiz/context";

const AUTO_RESET_MS = 5_500;

/**
 * Tela de despedida — mostrada após o médico clicar "Finalizar" na tela
 * de agradecimento. Serve como confirmação calorosa antes do auto-reset
 * pro próximo visitante. Duração: ~5.5s com auto-reset.
 */
export function StepFarewell() {
  const { dispatch } = useQuiz();

  // Auto-reset após alguns segundos (todo médico merece um sendoff, mas
  // o próximo visitante precisa poder entrar rápido).
  React.useEffect(() => {
    const t = window.setTimeout(
      () => dispatch({ type: "reset" }),
      AUTO_RESET_MS,
    );
    return () => window.clearTimeout(t);
  }, [dispatch]);

  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-8 py-8 text-center md:gap-10 md:py-12">
      {/* Símbolo Contourline sutil pulsando ao fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]"
      >
        <ContourlineMark
          variant="symbol"
          tone="navy"
          width={420}
          height={420}
          className="animate-pulse-soft"
        />
      </div>

      {/* Traço bronze decorativo */}
      <span
        aria-hidden="true"
        className="relative z-10 block h-px w-28 origin-center animate-rule-draw bg-[var(--color-bronze-500)]"
      />

      {/* Bronze kicker */}
      <p className="relative z-10 text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--color-bronze-600)]">
        Até breve
      </p>

      {/* Título principal */}
      <h1 className="relative z-10 font-display text-[clamp(2rem,4vw+1rem,3.75rem)] leading-[1.05]">
        Obrigado por participar.
      </h1>

      {/* Subtítulo */}
      <p className="relative z-10 max-w-xl text-[15px] leading-relaxed text-[var(--color-clinical-700)] md:text-base">
        Foi um prazer receber você no nosso stand. Desejamos um excelente
        congresso — e boa sorte no sorteio.
      </p>

      {/* CTA opcional — pula o countdown se operador quiser acelerar */}
      <Button
        variant="ghost"
        size="md"
        onClick={() => dispatch({ type: "reset" })}
        className="relative z-10 mt-2"
      >
        Passar para o próximo
      </Button>

      {/* Mini hint que a tela vai virar sozinha */}
      <div className="relative z-10 mt-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--color-clinical-400)]">
        <span className="h-px w-8 bg-[var(--color-clinical-300)]" />
        <span>A tela reinicia em instantes</span>
        <span className="h-px w-8 bg-[var(--color-clinical-300)]" />
      </div>
    </div>
  );
}
