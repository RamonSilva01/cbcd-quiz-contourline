import { createServiceClient } from "@/lib/supabase/server";
import { LeadsManager } from "./_components/leads-manager";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const supabase = createServiceClient();
  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, full_name, specialty, crm, phone, email, is_test, is_duplicate_of, lgpd_consent, quiz_completed_at, created_at, source, device_hint",
    )
    .order("created_at", { ascending: false })
    .limit(1000);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-3xl leading-tight">Leads</h1>
        <p className="mt-1 text-sm text-[var(--color-clinical-500)]">
          Gestão de cadastros · marque como teste ou delete registros
        </p>
      </header>
      <LeadsManager initialLeads={leads ?? []} />
    </div>
  );
}
