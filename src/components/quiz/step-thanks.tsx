"use client";

import * as React from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { ContourlineMark } from "@/components/brand/contourline-mark";
import { useQuiz } from "@/lib/quiz/context";
import { Button } from "@/components/ui/button";

const AUTO_RESET_SECONDS = 45;

interface StepThanksProps {
  isKiosk: boolean;
}

const FOLLOW_TARGETS = [
  {
    handle: "@contourlinemed",
    url: "https://www.instagram.com/contourlinemed/",
  },
  {
    handle: "@lumenisoficial",
    url: "https://www.instagram.com/lumenisoficial/",
  },
] as const;

/**
 * Formata o cumprimento da tela final:
 *   "Dra. Marina Carvalho"   → "Obrigado, Dr(a). Marina."
 *   "dr. joão silva"         → "Obrigado, Dr(a). João."
 *   "MARINA CARVALHO"        → "Obrigado, Dr(a). Marina."
 *   (vazio)                  → "Obrigado."
 * Usamos Dr(a) para incluir o público feminino.
 */
function formatGreeting(fullName: string | undefined): string {
  if (!fullName) return "Obrigado.";
  const noTitle = fullName
    .trim()
    .replace(/^(dr\(a\)|doutora?|dra|dr)\.?\s+/i, "");
  const first = noTitle.split(/\s+/)[0] ?? "";
  if (!first) return "Obrigado.";
  const pretty =
    first.charAt(0).toLocaleUpperCase("pt-BR") +
    first.slice(1).toLocaleLowerCase("pt-BR");
  return `Obrigado, Dr(a). ${pretty}.`;
}

/**
 * Ícone do Instagram usando o gradiente real da marca
 * (amarelo → laranja → magenta → roxo → azul).
 */
function InstagramIcon({ className }: { className?: string }) {
  const rawId = React.useId();
  const gradientId = `ig-grad-${rawId.replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="25%" stopColor="#FA7E1E" />
          <stop offset="50%" stopColor="#D62976" />
          <stop offset="75%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5.5"
        fill={`url(#${gradientId})`}
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="white"
        strokeWidth={1.9}
      />
      <circle cx="17.7" cy="6.3" r="1.15" fill="white" />
    </svg>
  );
}

export function StepThanks({ isKiosk }: StepThanksProps) {
  const { dispatch, lead } = useQuiz();
  const greeting = formatGreeting(lead.fullName);
  const [countdown, setCountdown] = React.useState(AUTO_RESET_SECONDS);

  React.useEffect(() => {
    if (!isKiosk) return;
    setCountdown(AUTO_RESET_SECONDS);
    const tick = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(tick);
          dispatch({ type: "reset" });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [isKiosk, dispatch]);

  return (
    <div className="relative flex flex-col items-center gap-6 py-4 text-center md:gap-8 md:py-10">
      {/* símbolo sutil como pano de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-8 flex justify-center opacity-[0.04]"
      >
        <ContourlineMark
          variant="symbol"
          tone="navy"
          width={380}
          height={380}
          className="animate-pulse-soft"
        />
      </div>

      {/* Traço bronze */}
      <span
        aria-hidden="true"
        className="relative z-10 block h-px w-24 origin-center animate-rule-draw bg-[var(--color-bronze-500)]"
      />

      {/* Título */}
      <h1 className="relative z-10 font-display text-[clamp(2rem,4vw+1rem,3.75rem)] leading-[1.02]">
        {greeting}
      </h1>

      {/* Texto do sorteio */}
      <div className="relative z-10 max-w-xl space-y-3 text-[15px] leading-relaxed text-[var(--color-clinical-700)] md:space-y-4 md:text-base">
        <p>Sua participação foi registrada.</p>
        <p>
          O sorteio acontece no dia{" "}
          <strong className="text-[var(--color-navy-900)]">
            02 de maio, durante a festa de encerramento do CBCD
          </strong>
          .
        </p>
      </div>

      {/* ============ IG FOLLOWS — regra pra validar ============ */}
      <div className="relative z-10 mt-2 w-full max-w-2xl">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--color-bronze-600)]">
          Para validar sua participação, siga
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {FOLLOW_TARGETS.map((target) => (
            <a
              key={target.handle}
              href={target.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-5 py-4 text-left shadow-[var(--shadow-clinical)] transition-all duration-[220ms] ease-[var(--ease-clinical)] hover:-translate-y-[1px] hover:border-[var(--color-bronze-500)] hover:shadow-[var(--shadow-elevated)] kiosk-lock"
            >
              <InstagramIcon className="h-11 w-11 shrink-0 transition-transform group-hover:scale-105" />
              <span className="flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-clinical-500)]">
                  Siga
                </span>
                <span className="block font-display text-[17px] leading-tight text-[var(--color-navy-900)] md:text-[19px]">
                  {target.handle}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 text-[var(--color-clinical-400)] transition-colors group-hover:text-[var(--color-bronze-600)]"
                strokeWidth={1.75}
              />
            </a>
          ))}
        </div>
      </div>

      {/* Aviso discreto sobre comunidade */}
      <p className="relative z-10 max-w-md text-[12px] leading-relaxed text-[var(--color-clinical-500)] md:text-[13px]">
        Todos os participantes receberão em breve o convite para a comunidade
        exclusiva de médicos da Contourline pelo WhatsApp.
      </p>

      {/* ============ NOVA PARTICIPAÇÃO — sempre visível ============ */}
      <div className="relative z-10 flex flex-col items-center gap-3 pt-2">
        <Button
          variant="accent"
          size="lg"
          onClick={() => dispatch({ type: "reset" })}
          className="min-w-[220px]"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
          Nova participação
        </Button>
        <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-clinical-400)]">
          Passe o tablet para o próximo médico
        </p>
      </div>

      {/* Countdown kiosk */}
      {isKiosk && (
        <div className="relative z-10 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--color-clinical-400)]">
          <span className="h-px w-8 bg-[var(--color-clinical-300)]" />
          <span>A tela reinicia em {countdown}s</span>
          <span className="h-px w-8 bg-[var(--color-clinical-300)]" />
        </div>
      )}
    </div>
  );
}
