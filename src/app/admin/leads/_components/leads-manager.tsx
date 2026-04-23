"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Lead {
  id: string;
  full_name: string;
  specialty: string;
  crm: string;
  phone: string;
  email: string;
  is_test: boolean;
  is_duplicate_of: string | null;
  lgpd_consent: boolean;
  quiz_completed_at: string | null;
  created_at: string;
  source: string;
  device_hint: string | null;
}

interface Props {
  initialLeads: Lead[];
}

const SPECIALTY_LABEL: Record<string, string> = {
  dermatologia: "Dermatologia",
  cirurgia_plastica: "Cirurgia Plástica",
  ginecologia: "Ginecologia",
  medicina_estetica: "Med. Estética",
  biomedicina_estetica: "Biomedicina Est.",
  odontologia: "Odontologia",
  fisioterapia_dermatofuncional: "Fisio Dermato",
  cirurgia_geral: "Cirurgia Geral",
  cirurgia_vascular: "Cirurgia Vascular",
  oftalmologia: "Oftalmologia",
  otorrinolaringologia: "Otorrino",
  endocrinologia: "Endocrinologia",
  clinica_medica: "Clínica Médica",
  outros: "Outra",
};

type FilterMode = "all" | "real" | "test";

export function LeadsManager({ initialLeads }: Props) {
  const router = useRouter();
  const [leads, setLeads] = React.useState(initialLeads);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<FilterMode>("all");

  const filteredLeads = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filter === "real" && lead.is_test) return false;
      if (filter === "test" && !lead.is_test) return false;
      if (!q) return true;
      return (
        lead.full_name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.crm.toLowerCase().includes(q) ||
        lead.phone.includes(q)
      );
    });
  }, [leads, search, filter]);

  const visibleIds = React.useMemo(
    () => filteredLeads.map((l) => l.id),
    [filteredLeads],
  );
  const selectedCount = selected.size;
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selected.has(id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const next = new Set(selected);
      visibleIds.forEach((id) => next.delete(id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      visibleIds.forEach((id) => next.add(id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const clearSelection = () => setSelected(new Set());

  const doDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Deletar ${ids.length} lead(s) permanentemente?\n\nEsta ação remove respostas, sessões e sorteios relacionados. Não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(`Erro: ${body?.error ?? res.status}`);
        return;
      }
      setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
      clearSelection();
      router.refresh();
    } catch {
      window.alert("Erro de conexão");
    } finally {
      setBusy(false);
    }
  };

  const doMarkTest = async (ids: string[], isTest: boolean) => {
    if (ids.length === 0) return;
    const label = isTest ? "marcar como teste" : "remover marca de teste";
    if (!window.confirm(`${ids.length} lead(s) — confirmar ${label}?`)) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, is_test: isTest }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(`Erro: ${body?.error ?? res.status}`);
        return;
      }
      setLeads((prev) =>
        prev.map((l) => (ids.includes(l.id) ? { ...l, is_test: isTest } : l)),
      );
      clearSelection();
      router.refresh();
    } catch {
      window.alert("Erro de conexão");
    } finally {
      setBusy(false);
    }
  };

  const doNuke = async () => {
    if (
      !window.confirm(
        "⚠️ Deletar TODOS os leads?\n\nIsso remove cadastros, respostas, sessões, consents e sorteios. Use apenas antes do evento para começar do zero.",
      )
    ) {
      return;
    }
    const code = window.prompt(
      'Para confirmar, digite exatamente: LIMPAR TUDO',
    );
    if (code !== "LIMPAR TUDO") {
      window.alert("Código incorreto. Operação cancelada.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, confirmation: "LIMPAR TUDO" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(`Erro: ${body?.error ?? res.status}`);
        return;
      }
      setLeads([]);
      clearSelection();
      router.refresh();
      window.alert("Todos os leads foram removidos.");
    } catch {
      window.alert("Erro de conexão");
    } finally {
      setBusy(false);
    }
  };

  const totalReal = leads.filter((l) => !l.is_test).length;
  const totalTest = leads.filter((l) => l.is_test).length;
  const totalCompleted = leads.filter((l) => l.quiz_completed_at).length;

  return (
    <div className="flex flex-col gap-6">
      {/* ===== Summary + Search ===== */}
      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <span>
            <strong className="font-display text-lg text-[var(--color-navy-900)]">
              {leads.length}
            </strong>{" "}
            <span className="text-[var(--color-clinical-500)]">total</span>
          </span>
          <span className="text-[var(--color-clinical-600)]">
            <strong>{totalReal}</strong> reais
          </span>
          <span className="text-[var(--color-clinical-600)]">
            <strong>{totalTest}</strong> teste
          </span>
          <span className="text-[var(--color-clinical-600)]">
            <strong>{totalCompleted}</strong> concluíram quiz
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Buscar por nome, e-mail, CRM ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 flex-1"
          />
          <div className="flex gap-2">
            {(["all", "real", "test"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-[var(--radius-md)] border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  filter === f
                    ? "border-[var(--color-navy-900)] bg-[var(--color-navy-900)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--color-clinical-600)] hover:border-[var(--color-navy-300)]"
                }`}
              >
                {f === "all" ? "Todos" : f === "real" ? "Reais" : "Teste"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Bulk actions bar ===== */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-bronze-500)] bg-[var(--color-bronze-500)]/10 px-5 py-3">
          <span className="text-sm font-medium text-[var(--color-bronze-700)]">
            {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => doMarkTest(Array.from(selected), true)}
              disabled={busy}
            >
              Marcar como teste
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => doMarkTest(Array.from(selected), false)}
              disabled={busy}
            >
              Desmarcar teste
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => doDelete(Array.from(selected))}
              disabled={busy}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Deletar selecionados
            </Button>
          </div>
          <button
            onClick={clearSelection}
            className="ml-auto text-xs text-[var(--color-clinical-500)] hover:text-[var(--color-navy-900)]"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* ===== Table ===== */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
        <div className="grid grid-cols-[auto_2fr_1.1fr_1fr_1.4fr_1fr_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-clinical-600)]">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            className="h-4 w-4 cursor-pointer accent-[var(--color-navy-900)]"
          />
          <span>Nome</span>
          <span>Especialidade</span>
          <span>CRM</span>
          <span>E-mail</span>
          <span>Cadastro</span>
          <span className="text-right">Ações</span>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {filteredLeads.length === 0 && (
            <div className="py-16 text-center text-sm text-[var(--color-clinical-500)]">
              {leads.length === 0
                ? "Nenhum lead cadastrado ainda."
                : "Nenhum lead bate com a busca."}
            </div>
          )}

          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`grid grid-cols-[auto_2fr_1.1fr_1fr_1.4fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--color-bone-50)] ${
                lead.is_test ? "opacity-60" : ""
              } ${selected.has(lead.id) ? "bg-[var(--color-bronze-500)]/5" : ""}`}
            >
              <input
                type="checkbox"
                checked={selected.has(lead.id)}
                onChange={() => toggleOne(lead.id)}
                className="h-4 w-4 cursor-pointer accent-[var(--color-navy-900)]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-navy-900)]">
                    {lead.full_name}
                  </span>
                  {lead.is_test && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                      teste
                    </span>
                  )}
                  {lead.is_duplicate_of && (
                    <span className="rounded-full bg-[var(--color-clinical-300)]/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[var(--color-clinical-600)]">
                      duplicado
                    </span>
                  )}
                  {lead.quiz_completed_at && (
                    <span className="rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[var(--success)]">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-clinical-500)]">
                  {lead.phone}
                </span>
              </div>
              <span className="text-xs text-[var(--color-clinical-600)]">
                {SPECIALTY_LABEL[lead.specialty] ?? lead.specialty}
              </span>
              <span className="font-mono text-xs uppercase text-[var(--color-clinical-600)]">
                {lead.crm}
              </span>
              <span
                className="truncate text-xs text-[var(--color-clinical-600)]"
                title={lead.email}
              >
                {lead.email}
              </span>
              <span className="text-xs text-[var(--color-clinical-500)]">
                {new Date(lead.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => doMarkTest([lead.id], !lead.is_test)}
                  disabled={busy}
                  title={lead.is_test ? "Desmarcar teste" : "Marcar como teste"}
                  className="flex h-8 items-center rounded-[var(--radius-sm)] px-2 text-[10px] uppercase tracking-wider text-[var(--color-clinical-500)] hover:bg-[var(--color-bone-200)] hover:text-[var(--color-navy-900)]"
                >
                  {lead.is_test ? "des-teste" : "teste"}
                </button>
                <button
                  onClick={() => doDelete([lead.id])}
                  disabled={busy}
                  title="Deletar"
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-clinical-400)] hover:bg-red-50 hover:text-red-600"
                  aria-label="Deletar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Danger zone ===== */}
      <details className="group rounded-[var(--radius-lg)] border border-red-200 bg-red-50/40 p-5">
        <summary className="cursor-pointer list-none text-sm font-medium text-red-800">
          <span className="inline-flex items-center gap-2">
            <span className="transition-transform group-open:rotate-90">▸</span>
            Zona perigosa — limpar todos os dados antes do evento
          </span>
        </summary>
        <div className="mt-5 flex flex-col gap-3">
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-clinical-700)]">
            Remove <strong>TODOS os leads</strong>, respostas do quiz, sessões,
            consentimentos LGPD e sorteios já realizados. Use apenas para zerar
            o banco antes do evento. <strong>Ação irreversível</strong>.
          </p>
          <div>
            <Button
              variant="destructive"
              size="md"
              onClick={doNuke}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" />
              Limpar TODOS os dados
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
