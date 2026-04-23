import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeCRM } from "@/lib/quiz/crm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  crm: z.string().min(3).max(30),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "CRM inválido" }, { status: 422 });
  }

  const normalized = normalizeCRM(parsed.data.crm);
  if (!normalized) {
    return NextResponse.json({ exists: false });
  }

  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("crm_normalized", normalized)
    .eq("is_test", false);

  if (error) {
    console.error("[check-crm] query failed", error);
    // Falha aberta: se a consulta falhar, permitir submit (o índice único
    // do banco ainda barra duplicidade no final — é a rede de segurança).
    return NextResponse.json({ exists: false, warn: "check_failed" });
  }

  return NextResponse.json({ exists: (count ?? 0) > 0 });
}
