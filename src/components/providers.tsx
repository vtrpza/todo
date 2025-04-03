"use client";

import { AppProvider } from "@/lib/store";
import { ToastWrapper } from "./ui/toast-wrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
      <ToastWrapper />
    </AppProvider>
  );
} 