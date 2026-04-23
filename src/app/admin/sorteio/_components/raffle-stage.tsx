"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RaffleTheater } from "./raffle-theater";

interface Winner {
  id: string;
  full_name: string;
  specialty: string;
  crm: string;
}

interface HistoryRow {
  id: string;
  raffle_name: string;
  drawn_at: string;
  total_eligible: number;
  winner_lead_id: string;
  notes: string | null;
  winner: Winner | null;
}

interface Props {
  eligibleCount: number;
  history: HistoryRow[];
}

const SPECIALTY_LABEL: Record<string, string> = {
  dermatologia: "Dermatologia",
  cirurgia_plastica: "Cirurgia Plástica",
  ginecologia: "Ginecologia",
  medicina_estetica: "Medicina Estética",
  biomedicina_estetica: "Biomedicina Estética",
  odontologia: "Odontologia",
  fisioterapia_dermatofuncional: "Fisioterapia Dermatofuncional",
  cirurgia_geral: "Cirurgia Geral",
  cirurgia_vascular: "Cirurgia Vascular",
  oftalmologia: "Oftalmologia",
  otorrinolaringologia: "Otorrinolaringologia",
  endocrinologia: "Endocrinologia",
  clinica_medica: "Clínica Médica",
  outros: "Outra",
};

export function RaffleStage({ eligibleCount, history }: Props) {
  const [theaterOpen, setTheaterOpen] = React.useState(false);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Card principal — contador + botão */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-10 text-center shadow-[var(--shadow-clinical)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--color-bronze-600)]">
            Médicos participando
          </p>
          <p className="mt-4 font-display text-7xl leading-none tabular-nums text-[var(--color-navy-900)] md:text-8xl">
            {eligibleCount}
          </p>
          <p className="mt-4 text-sm text-[var(--color-clinical-500)]">
            {eligibleCount === 0
              ? "Aguardando primeiros participantes para executar o sorteio."
              : "Quiz completo + LGPD + CRM único"}
          </p>

          <div className="mt-10">
            <Button
              variant="primary"
              size="xl"
              onClick={() => setTheaterOpen(true)}
              disabled={eligibleCount === 0}
              className="min-w-[260px]"
            >
              <Play className="h-4 w-4" strokeWidth={2} />
              Abrir palco do sorteio
            </Button>
          </div>

          <p className="mt-6 max-w-xs text-[11px] leading-relaxed text-[var(--color-clinical-500)]">
            Abre o palco em tela cheia com a imagem do triLift® e a contagem
            de participantes. O segundo clique dentro do palco inicia a
            rolagem de nomes.
          </p>
        </div>

        {/* Histórico */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-clinical-600)]">
            Histórico de sorteios
          </h2>

          {history.length === 0 ? (
            <p className="text-sm text-[var(--color-clinical-500)]">
              Nenhum sorteio executado ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-[var(--border)]">
              {history.map((h) => (
                <div key={h.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">
                      {h.winner?.full_name ?? "—"}
                    </span>
                    <span className="text-xs text-[var(--color-clinical-500)]">
                      {new Date(h.drawn_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-clinical-500)]">
                    {h.winner && (
                      <span>
                        CRM {h.winner.crm} ·{" "}
                        {SPECIALTY_LABEL[h.winner.specialty] ??
                          h.winner.specialty}
                      </span>
                    )}
                    <span>{h.total_eligible} elegíveis</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {theaterOpen && (
        <RaffleTheater
          onClose={() => setTheaterOpen(false)}
          eligibleCount={eligibleCount}
        />
      )}
    </>
  );
}
