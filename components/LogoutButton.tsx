"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleLogout}
      disabled={loading}
      className="gap-2 text-zinc-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
    >
      <LogOut size={18} />
      {loading ? "Saindo…" : "Sair"}
    </Button>
  );
}
