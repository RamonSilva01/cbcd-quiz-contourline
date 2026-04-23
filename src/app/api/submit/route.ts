import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { submitPayloadSchema } from "@/lib/quiz/schemas";
import { QUIZ_QUESTIONS, QUIZ_VERSION } from "@/lib/quiz/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONSENT_VERSION = "v1.0-2026-04-23";

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = submitPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { lead, answers, deviceHint, source } = parsed.data;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const supabase = createServiceClient();

  // 1) Busca IDs das perguntas ativas
  const { data: dbQuestions, error: qErr } = await supabase
    .from("quiz_questions")
    .select("id, question_number, correct_key, version")
    .eq("version", QUIZ_VERSION)
    .eq("is_active", true);

  if (qErr || !dbQuestions || dbQuestions.length < 3) {
    console.error("[submit] missing questions", qErr);
    return NextResponse.json(
      { error: "Configuração do quiz indisponível. Avise a equipe." },
      { status: 500 },
    );
  }

  const qById = new Map(dbQuestions.map((q) => [q.question_number, q]));

  // 2) Cria lead
  const { data: leadRow, error: leadErr } = await supabase
    .from("leads")
    .insert({
      full_name: lead.fullName,
      specialty: lead.specialty,
      specialty_other: lead.specialtyOther ?? null,
      crm: lead.crm,
      phone: lead.phone,
      email: lead.email,
      lgpd_consent: true,
      consent_version: CONSENT_VERSION,
      source,
      device_hint: deviceHint,
      ip_address: ip,
      user_agent: userAgent,
      quiz_completed_at: new Date().toISOString(),
    })
    .select("id, is_duplicate_of")
    .single();

  if (leadErr || !leadRow) {
    // 23505 = unique_violation — CRM já cadastrado
    const pgCode = (leadErr as { code?: string } | null)?.code;
    if (pgCode === "23505") {
      return NextResponse.json(
        {
          error:
            "Este CRM já participou do quiz. Cada médico pode concorrer ao sorteio apenas uma vez.",
          code: "crm_duplicate",
        },
        { status: 409 },
      );
    }

    console.error("[submit] lead insert failed", leadErr);
    return NextResponse.json(
      { error: "Falha ao salvar cadastro. Tente novamente." },
      { status: 500 },
    );
  }

  // 3) Cria sessão
  const { data: sessionRow, error: sessErr } = await supabase
    .from("quiz_sessions")
    .insert({
      lead_id: leadRow.id,
      quiz_version: QUIZ_VERSION,
      status: "completed",
      completed_at: new Date().toISOString(),
      device_hint: deviceHint,
      ip_address: ip,
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (sessErr || !sessionRow) {
    console.error("[submit] session insert failed", sessErr);
    return NextResponse.json(
      { error: "Falha ao registrar sessão." },
      { status: 500 },
    );
  }

  // 4) Insere answers em batch
  const answerRows = [1, 2, 3].map((n) => {
    const q = qById.get(n);
    const key = (answers as Record<string, "A" | "B" | "C" | "D">)[`q${n}`];
    const isCorrect = q?.correct_key === key;
    return {
      session_id: sessionRow.id,
      lead_id: leadRow.id,
      question_id: q!.id,
      question_number: n,
      answer_selected: key,
      is_correct: isCorrect,
    };
  });

  // sanity check
  const localCorrect = QUIZ_QUESTIONS.map((q) => q.correct).join("");
  const dbCorrect = [1, 2, 3]
    .map((n) => qById.get(n)?.correct_key ?? "?")
    .join("");
  if (localCorrect !== dbCorrect) {
    console.warn("[submit] quiz version mismatch", {
      localCorrect,
      dbCorrect,
    });
  }

  const { error: ansErr } = await supabase
    .from("quiz_answers")
    .insert(answerRows);

  if (ansErr) {
    console.error("[submit] answers insert failed", ansErr);
  }

  return NextResponse.json(
    {
      ok: true,
      leadId: leadRow.id,
      isDuplicate: !!leadRow.is_duplicate_of,
    },
    { status: 200 },
  );
}
