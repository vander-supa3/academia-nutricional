"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TreinoGuiadoRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/treinos");
  }, [router]);
  return (
    <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
      Redirecionando para a biblioteca de treinos...
    </div>
  );
}
