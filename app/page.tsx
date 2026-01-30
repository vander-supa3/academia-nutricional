"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace("/hoje");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    })();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="text-zinc-500 text-sm">Carregando...</div>
      </div>
    );
  }

  return null;
}
