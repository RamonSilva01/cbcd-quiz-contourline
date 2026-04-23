import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [kpis, accuracy, specialty, recent] = await Promise.all([
    supabase.from("v_dashboard_kpis").select("*").single(),
    supabase.from("v_accuracy_per_question").select("*"),
    supabase.from("v_leads_by_specialty").select("*"),
    supabase
      .from("leads")
      .select(
        "id, full_name, specialty, crm, created_at, quiz_completed_at, is_duplicate_of",
      )
      .eq("is_test", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    kpis: kpis.data,
    accuracy: accuracy.data ?? [],
    specialty: specialty.data ?? [],
    recent: recent.data ?? [],
  });
}
