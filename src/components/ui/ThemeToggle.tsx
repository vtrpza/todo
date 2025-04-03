"use client";

import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { Sun, Moon, Laptop } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { state, updateTheme } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Garantir que o componente só renderize no cliente para evitar incompatibilidades de SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateTheme(theme);
  };

  const currentTheme = state.settings.theme;

  const getIcon = (theme: 'light' | 'dark' | 'system') => {
    switch (theme) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      case 'system':
        return <Laptop size={16} />;
    }
  };

  const getLabel = (theme: 'light' | 'dark' | 'system') => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      case 'system':
        return 'Sistema';
    }
  };

  const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];

  return (
    <div className="bg-card border rounded-lg p-2 fixed bottom-4 right-4 shadow-lg z-10">
      <div className="flex gap-2">
        {themes.map(theme => (
          <motion.div
            key={theme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant={currentTheme === theme ? "default" : "ghost"}
              size="sm"
              onClick={() => handleThemeChange(theme)}
              className="gap-2"
            >
              {getIcon(theme)}
              <span className="text-xs">{getLabel(theme)}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 