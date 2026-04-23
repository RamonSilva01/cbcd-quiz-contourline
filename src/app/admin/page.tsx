import { createServiceClient } from "@/lib/supabase/server";
import { DashboardLive } from "./_components/dashboard-live";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const [kpisRes, accuracyRes, specialtyRes, recentRes] = await Promise.all([
    supabase.from("v_dashboard_kpis").select("*").single(),
    supabase.from("v_accuracy_per_question").select("*"),
    supabase.from("v_leads_by_specialty").select("*"),
    supabase
      .from("leads")
      .select("id, full_name, specialty, crm, created_at, quiz_completed_at, is_duplicate_of")
      .eq("is_test", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const kpis = kpisRes.data ?? {
    total_leads: 0,
    leads_last_hour: 0,
    leads_completed: 0,
    consented_total: 0,
    completion_pct: 0,
  };

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="font-display text-3xl leading-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-clinical-500)]">
          Monitoramento em tempo real · CBCD 2026
        </p>
      </header>

      <DashboardLive
        initialKpis={kpis}
        initialAccuracy={accuracyRes.data ?? []}
        initialSpecialty={specialtyRes.data ?? []}
        initialRecent={recentRes.data ?? []}
      />
    </div>
  );
}
