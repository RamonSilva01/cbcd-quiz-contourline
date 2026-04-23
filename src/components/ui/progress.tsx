"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Progresso segmentado — 01 · 02 · 03 — com traço bronze preenchendo o segmento ativo.
 * Design: restraint, sem barras cheias.
 */
interface QuizProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  total: number;
  current: number; // 1-based (1 = primeira pergunta)
}

export function QuizProgress({
  total,
  current,
  className,
  ...props
}: QuizProgressProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        "text-[10px] font-medium uppercase tracking-[0.2em]",
        className,
      )}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      {...props}
    >
      {Array.from({ length: total }).map((_, idx) => {
        const step = idx + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "tabular-nums",
                  isActive
                    ? "text-[var(--color-bronze-500)]"
                    : isDone
                    ? "text-[var(--color-navy-700)]"
                    : "text-[var(--color-clinical-400)]",
                )}
              >
                {String(step).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "h-[2px] w-8 origin-left transition-transform duration-[320ms] ease-[var(--ease-clinical)]",
                  isActive
                    ? "scale-x-100 bg-[var(--color-bronze-500)]"
                    : isDone
                    ? "scale-x-100 bg-[var(--color-navy-700)]"
                    : "scale-x-100 bg-[var(--color-clinical-300)]",
                )}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
