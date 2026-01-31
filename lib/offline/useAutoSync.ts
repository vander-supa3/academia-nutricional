"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOnline } from "./useOnline";
import { syncOfflineQueue } from "./sync";

export function useAutoSync() {
  const online = useOnline();
  const ran = useRef(false);

  useEffect(() => {
    if (!online) return;
    if (!ran.current) {
      ran.current = true;
      syncOfflineQueue()
        .then((r) => {
          if (r.synced === 1) toast.success("Sincronizado com sucesso.");
          if (r.synced > 1) toast.success(`Sincronizado: ${r.synced} atualizações.`);
        })
        .catch(() => {});
      return;
    }
    syncOfflineQueue()
      .then((r) => {
        if (r.synced === 1) toast.success("Sincronizado com sucesso.");
        if (r.synced > 1) toast.success(`Sincronizado: ${r.synced} atualizações.`);
      })
      .catch(() => {});
  }, [online]);
}
