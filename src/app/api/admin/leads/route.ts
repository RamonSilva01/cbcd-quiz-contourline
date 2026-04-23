import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return { error: "unauthorized" as const, status: 401 };
  const { data: admin } = await auth
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { error: "forbidden" as const, status: 403 };
  return { user };
}

const deleteSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
  confirmation: z.string().optional(),
});

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(1000),
  is_test: z.boolean(),
});

// =========================================================
// DELETE — apaga um ou vários leads (ou TODOS com confirmação)
// =========================================================
export async function DELETE(req: NextRequest) {
  const authCheck = await requireAdmin();
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  }

  const svc = createServiceClient();

  // ----- LIMPAR TUDO -----
  if (parsed.data.all) {
    if (parsed.data.confirmation !== "LIMPAR TUDO") {
      return NextResponse.json(
        { error: "Confirmação incorreta" },
        { status: 400 },
      );
    }
    // raffle_draws tem FK pra leads sem cascade — apagar primeiro
    await svc
      .from("raffle_draws")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await svc
      .from("leads")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.error("[leads] nuke failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, cleared: true });
  }

  // ----- DELETE POR IDs -----
  const ids = parsed.data.ids;
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "IDs obrigatórios" }, { status: 400 });
  }

  // Remove qualquer raffle_draws que dependa dos leads (seria bloqueio por FK)
  await svc.from("raffle_draws").delete().in("winner_lead_id", ids);

  const { error } = await svc.from("leads").delete().in("id", ids);
  if (error) {
    console.error("[leads] delete failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, deleted: ids.length });
}

// =========================================================
// PATCH — marca/desmarca como teste (soft — preserva dado)
// =========================================================
export async function PATCH(req: NextRequest) {
  const authCheck = await requireAdmin();
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status },
    );
  }

  const body = (await req.json().catch(() => ({}))) as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  }

  const svc = createServiceClient();
  const { error } = await svc
    .from("leads")
    .update({ is_test: parsed.data.is_test })
    .in("id", parsed.data.ids);

  if (error) {
    console.error("[leads] patch failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, updated: parsed.data.ids.length });
}
