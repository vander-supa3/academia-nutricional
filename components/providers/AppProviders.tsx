"use client";

import { QueryProvider } from "./QueryProvider";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-center" />
    </QueryProvider>
  );
}
