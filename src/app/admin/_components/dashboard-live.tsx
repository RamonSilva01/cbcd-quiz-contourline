"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

interface Kpi {
  total_leads: number;
  leads_last_hour: number;
  leads_completed: number;
  consented_total: number;
  completion_pct: number | null;
}

interface Accuracy {
  question_number: number;
  accuracy_pct: number | null;
  total_answers: number;
}

interface SpecialtyRow {
  specialty: string;
  total: number;
}

interface LeadRow {
  id: string;
  full_name: string;
  specialty: string;
  crm: string;
  created_at: string;
  quiz_completed_at: string | null;
  is_duplicate_of: string | null;
}

interface Props {
  initialKpis: Kpi;
  initialAccuracy: Accuracy[];
  initialSpecialty: SpecialtyRow[];
  initialRecent: LeadRow[];
}

const SPECIALTY_LABEL: Record<string, string> = {
  dermatologia: "Dermatologia",
  cirurgia_plastica: "Cirurgia Plástica",
  ginecologia: "Ginecologia",
  medicina_estetica: "Medicina Estética",
  biomedicina_estetica: "Biomedicina Estética",
  odontologia: "Odontologia",
  fisioterapia_dermatofuncional: "Fisioterapia Dermatofuncional",
  outros: "Outra",
};

export function DashboardLive({
  initialKpis,
  initialAccuracy,
  initialSpecialty,
  initialRecent,
}: Props) {
  const [kpis, setKpis] = React.useState(initialKpis);
  const [accuracy, setAccuracy] = React.useState(initialAccuracy);
  const [specialty, setSpecialty] = React.useState(initialSpecialty);
  const [recent, setRecent] = React.useState(initialRecent);
  const [isRefreshing, setRefreshing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      if (body.kpis) setKpis(body.kpis);
      if (body.accuracy) setAccuracy(body.accuracy);
      if (body.specialty) setSpecialty(body.specialty);
      if (body.recent) setRecent(body.recent);
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("leads-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        () => refresh(),
      )
      .subscribe();

    const intervalId = window.setInterval(refresh, 30_000);

    return () => {
      channel.unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Total de leads" value={kpis.total_leads} />
        <Kpi label="Na última hora" value={kpis.leads_last_hour} accent />
        <Kpi label="Quiz concluído" value={kpis.leads_completed} />
        <Kpi label="LGPD opt-in" value={kpis.consented_total} />
        <Kpi
          label="Taxa de conclusão"
          value={
            kpis.completion_pct != null ? `${kpis.completion_pct}%` : "—"
          }
        />
      </div>

      {/* Accuracy + Specialty */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-clinical-600)]">
            Taxa de acerto por pergunta
          </h2>
          <div className="flex flex-col gap-3">
            {accuracy.length === 0 && (
              <p className="text-sm text-[var(--color-clinical-500)]">
                Sem respostas ainda.
              </p>
            )}
            {accuracy.map((a) => (
              <div key={a.question_number} className="flex items-center gap-4">
                <span className="w-10 text-sm font-medium tabular-nums">
                  Q{a.question_number}
                </span>
                <div className="h-2 flex-1 rounded-full bg-[var(--color-bone-200)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-bronze-500)]"
                    style={{
                      width: `${Math.min(100, a.accuracy_pct ?? 0)}%`,
                    }}
                  />
                </div>
                <span className="w-14 text-right text-sm tabular-nums text-[var(--color-clinical-600)]">
                  {a.accuracy_pct != null ? `${Math.round(a.accuracy_pct)}%` : "—"}
                </span>
                <span className="w-14 text-right text-xs tabular-nums text-[var(--color-clinical-400)]">
                  {a.total_answers}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-clinical-600)]">
            Leads por especialidade
          </h2>
          <div className="flex flex-col gap-3">
            {specialty.length === 0 && (
              <p className="text-sm text-[var(--color-clinical-500)]">
                Sem leads ainda.
              </p>
            )}
            {specialty.map((s) => (
              <div key={s.specialty} className="flex items-center justify-between">
                <span className="text-sm">
                  {SPECIALTY_LABEL[s.specialty] ?? s.specialty}
                </span>
                <span className="text-sm tabular-nums text-[var(--color-clinical-600)]">
                  {s.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-clinical-600)]">
            Leads recentes
          </h2>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="text-xs uppercase tracking-[0.16em] text-[var(--color-bronze-600)] hover:text-[var(--color-navy-900)] disabled:opacity-50"
          >
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recent.length === 0 && (
            <div className="px-6 py-8 text-sm text-[var(--color-clinical-500)]">
              Nenhum lead captado ainda.
            </div>
          )}
          {recent.map((lead) => (
            <div
              key={lead.id}
              className="grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lead.full_name}</span>
                  {lead.is_duplicate_of && (
                    <span className="rounded-full bg-[var(--color-bone-200)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-clinical-500)]">
                      duplicado
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-clinical-500)]">
                  CRM {lead.crm}
                </span>
              </div>
              <span className="text-sm text-[var(--color-clinical-600)]">
                {SPECIALTY_LABEL[lead.specialty] ?? lead.specialty}
              </span>
              <span className="text-sm tabular-nums text-[var(--color-clinical-600)]">
                {new Date(lead.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span
                className={
                  lead.quiz_completed_at
                    ? "text-sm text-[var(--success)]"
                    : "text-sm text-[var(--color-clinical-400)]"
                }
              >
                {lead.quiz_completed_at ? "Concluído" : "Incompleto"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5`}
    >
      <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-clinical-500)]">
        {label}
      </span>
      <span
        className={`mt-2 block font-display tabular-nums ${
          accent
            ? "text-4xl text-[var(--color-bronze-600)]"
            : "text-4xl text-[var(--color-navy-900)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
