"use client";

import { AppProvider } from "@/lib/store";
import { ToastWrapper } from "./ui/toast-wrapper";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "./ui/ThemeToggle";
import { Stats } from "./Stats";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppProvider>
        {children}
        <ToastWrapper />
        <ThemeToggle />
        <Stats />
      </AppProvider>
    </ThemeProvider>
  );
} 