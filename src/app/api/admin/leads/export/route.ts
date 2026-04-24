import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  outros: "Outra especialidade",
};

/** Escape CSV cell — quote se tiver ; " ou newline */
function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (
    str.includes(";") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =========================================================
// GET — exporta todos os leads como CSV (UTF-8 BOM, ;)
// Compatível com Excel Brasil + Google Sheets + Numbers.
// =========================================================
export async function GET(_req: NextRequest) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: admin } = await auth
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();
  const { data: leads, error } = await svc
    .from("leads")
    .select(
      "id, full_name, specialty, specialty_other, crm, phone, email, lgpd_consent, quiz_completed_at, is_duplicate_of, is_test, created_at, source, device_hint",
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[leads/export] fetch failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "Nome Completo",
    "E-mail",
    "Telefone",
    "CRM",
    "Especialidade",
    "LGPD",
    "Quiz Concluído Em",
    "Teste?",
    "Duplicata?",
    "Cadastrado Em",
    "Origem",
    "Device",
  ];

  const rows = (leads ?? []).map((l) => [
    l.full_name,
    l.email,
    l.phone,
    l.crm,
    l.specialty === "outros" && l.specialty_other
      ? `Outros (${l.specialty_other})`
      : SPECIALTY_LABEL[l.specialty] ?? l.specialty,
    l.lgpd_consent ? "Sim" : "Não",
    formatDate(l.quiz_completed_at),
    l.is_test ? "Sim" : "Não",
    l.is_duplicate_of ? "Sim" : "Não",
    formatDate(l.created_at),
    l.source ?? "",
    l.device_hint ?? "",
  ]);

  const BOM = "﻿";
  const csv =
    BOM +
    [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `leads-cbcd-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
