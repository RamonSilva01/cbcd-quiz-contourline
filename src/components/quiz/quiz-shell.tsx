"use client";

import * as React from "react";
import { ContourlineMark } from "@/components/brand/contourline-mark";
import { QuizProgress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface QuizShellProps {
  children: React.ReactNode;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
  animationKey?: string;
  compact?: boolean;
}

export function QuizShell({
  children,
  showProgress = false,
  currentStep = 1,
  totalSteps = 3,
  animationKey,
  compact = false,
}: QuizShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* ============== HEADER ============== */}
      <header
        className={cn(
          "flex items-center justify-between gap-4 px-5 sm:px-8 md:px-12 lg:px-16",
          compact ? "py-4" : "py-5 md:py-7",
        )}
      >
        {/* Logo: full no sm+; símbolo no mobile pequeno */}
        <div className="flex items-center">
          <span className="hidden sm:block">
            <ContourlineMark
              variant="full"
              tone="navy"
              width={160}
              height={36}
              priority
              className="md:!h-10 md:!w-[180px]"
            />
          </span>
          <span className="sm:hidden">
            <ContourlineMark
              variant="full"
              tone="navy"
              width={128}
              height={28}
              priority
            />
          </span>
        </div>

        {showProgress ? (
          <QuizProgress total={totalSteps} current={currentStep} />
        ) : (
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-clinical-500)] md:text-[11px]">
            <span className="hidden sm:inline">triLift® · </span>CBCD 2026
          </span>
        )}
      </header>

      {/* ============== MAIN ============== */}
      <main
        className={cn(
          "flex flex-1 items-start justify-center px-5 sm:px-8 md:items-center md:px-12 lg:px-16",
          // Mobile: espaço generoso pra CTA sticky + safe-area iOS não cobrirem conteúdo.
          // 44 = 11rem = 176px (cobre sticky bar ~96px + safe-area ~34px + folga 46px)
          "pb-44 sm:pb-16 md:pb-10",
        )}
      >
        <div
          key={animationKey}
          className={cn(
            "w-full animate-fade-up",
            "max-w-2xl md:max-w-3xl lg:max-w-5xl",
          )}
        >
          {children}
        </div>
      </main>

      {/* ============== FOOTER ============== */}
      <footer className="hidden px-5 py-5 text-center text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--color-clinical-400)] sm:block md:text-[11px]">
        Centro de Convenções de Goiânia · 30 abr – 03 mai 2026
      </footer>
    </div>
  );
}
