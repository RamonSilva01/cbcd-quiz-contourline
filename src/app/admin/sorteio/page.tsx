import { createServiceClient } from "@/lib/supabase/server";
import { RaffleStage } from "./_components/raffle-stage";

export const dynamic = "force-dynamic";

export default async function RafflePage() {
  const supabase = createServiceClient();

  const { count: eligibleCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("is_duplicate_of", null)
    .eq("is_test", false)
    .eq("lgpd_consent", true)
    .not("quiz_completed_at", "is", null);

  const { data: history } = await supabase
    .from("raffle_draws")
    .select(
      "id, raffle_name, drawn_at, total_eligible, winner_lead_id, notes",
    )
    .order("drawn_at", { ascending: false })
    .limit(10);

  const winnerIds = (history ?? []).map((h) => h.winner_lead_id);
  const { data: winners } = winnerIds.length
    ? await supabase
        .from("leads")
        .select("id, full_name, specialty, crm")
        .in("id", winnerIds)
    : { data: [] };

  const winnerMap = new Map((winners ?? []).map((w) => [w.id, w]));

  const historyWithWinners =
    history?.map((h) => ({
      ...h,
      winner: winnerMap.get(h.winner_lead_id) ?? null,
    })) ?? [];

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-3xl leading-tight">Sorteio ao vivo</h1>
        <p className="mt-1 text-sm text-[var(--color-clinical-500)]">
          triLift® · CBCD 2026 · festa de encerramento 02/mai
        </p>
      </header>

      <RaffleStage
        eligibleCount={eligibleCount ?? 0}
        history={historyWithWinners}
      />
    </div>
  );
}
