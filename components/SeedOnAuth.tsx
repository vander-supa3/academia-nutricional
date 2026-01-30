"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ensureUserSeed } from "@/lib/ensureSeed";

export function SeedOnAuth() {
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return;
      await ensureUserSeed().catch(console.error);
    };
    run();
  }, []);
  return null;
}
