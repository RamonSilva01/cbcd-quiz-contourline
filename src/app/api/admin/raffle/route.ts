import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const body = (await req.json().catch(() => ({}))) as {
    notes?: string | null;
    excludeIds?: string[];
  };

  // Valida e filtra UUIDs válidos (defensivo contra payload malformado)
  const exclude =
    Array.isArray(body.excludeIds) && body.excludeIds.length > 0
      ? body.excludeIds.filter(
          (id): id is string =>
            typeof id === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              id,
            ),
        )
      : null;

  // Chama a função SQL execute_raffle_live (auto-gera seed internamente,
  // grava snapshot + hash pra auditoria — sem precisar de seed pública).
  const { data: draw, error } = await auth.rpc("execute_raffle_live", {
    p_raffle_name: "CBCD_2026_trilift",
    p_notes: body.notes?.trim() || null,
    p_exclude_ids: exclude,
  });

  if (error || !draw) {
    console.error("[raffle] execute_raffle_live failed", error);
    return NextResponse.json(
      { error: error?.message ?? "Falha no sorteio" },
      { status: 500 },
    );
  }

  // Carrega o vencedor
  const service = createServiceClient();
  const { data: winner } = await service
    .from("leads")
    .select("id, full_name, specialty, crm")
    .eq("id", draw.winner_lead_id)
    .single();

  // Carrega TODOS os elegíveis (para animação de rolagem no theater)
  const eligibleIds = (draw.eligibility_snapshot as string[]) ?? [];
  const { data: eligible } = eligibleIds.length
    ? await service
        .from("leads")
        .select("id, full_name, specialty")
        .in("id", eligibleIds)
    : { data: [] };

  return NextResponse.json({
    ok: true,
    winner,
    eligible: eligible ?? [],
    totalEligible: draw.total_eligible,
    drawnAt: draw.drawn_at,
    eligibilityHash: draw.eligibility_hash,
  });
}
