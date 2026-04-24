"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LgpdDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lgpd-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-navy-950)]/50 p-0 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-t-[var(--radius-lg)] bg-white p-8 shadow-[var(--shadow-elevated)] md:rounded-[var(--radius-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-clinical-500)] hover:bg-[var(--color-bone-200)]"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="lgpd-title"
          className="mb-4 font-display text-2xl leading-tight"
        >
          Tratamento de dados — LGPD
        </h2>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-2 text-sm leading-relaxed text-[var(--color-clinical-700)]">
          <p>
            Ao participar deste quiz, você autoriza a{" "}
            <strong className="text-[var(--color-navy-900)]">Contourline Medicina Estética</strong>{" "}
            a coletar e tratar os dados informados — nome, especialidade, CRM,
            telefone e e-mail — para as finalidades descritas abaixo.
          </p>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-navy-900)]">
              Finalidades
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Participação no <strong>sorteio</strong> do stand da Contourline,
                apurado no último dia do CBCD 2026 (03/mai).
              </li>
              <li>
                Envio de <strong>comunicações profissionais</strong> sobre
                produtos, tecnologias, treinamentos e conteúdos da Contourline,
                por WhatsApp, e-mail ou telefone, incluindo convite para grupo
                exclusivo de médicos.
              </li>
              <li>
                <strong>Gestão de relacionamento comercial</strong> e follow-up
                por representantes oficiais.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-navy-900)]">
              Retenção e direitos
            </h3>
            <p>
              Os dados são armazenados em ambiente controlado (Supabase · AWS)
              pelo prazo máximo de <strong>24 meses</strong> após o evento,
              salvo obrigação legal diversa. Você pode <strong>revogar este consentimento
              a qualquer momento</strong> enviando mensagem para{" "}
              <a
                href="mailto:marketing@contourline.com.br"
                className="underline decoration-[var(--color-bronze-500)] underline-offset-4"
              >
                marketing@contourline.com.br
              </a>
              , sem impacto retroativo sobre os tratamentos já realizados.
            </p>
          </div>

          <p className="text-xs text-[var(--color-clinical-500)]">
            Versão do termo: v1.0 — 23/abr/2026
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="primary" size="md">
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}
