"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminSignOut() {
  const router = useRouter();
  const supabase = createClient();

  const onClick = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      Sair
    </Button>
  );
}
