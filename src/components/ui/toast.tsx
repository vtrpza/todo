"use client";

import { useEffect, useState } from "react";
import { Toast as ToastType } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 3000;
  
  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress < 0 ? 0 : newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="size-5" />;
      case "error":
        return <AlertCircle className="size-5" />;
      case "warning":
        return <AlertTriangle className="size-5" />;
      case "info":
      default:
        return <Info className="size-5" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800";
      case "info":
      default:
        return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 shadow-md backdrop-blur-sm",
        getColors()
      )}
      layout
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="ml-auto flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      </div>
      
      {duration > 0 && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          className={cn(
            "absolute bottom-0 left-0 h-1",
            toast.type === "success" ? "bg-green-500 dark:bg-green-400" :
            toast.type === "error" ? "bg-red-500 dark:bg-red-400" :
            toast.type === "warning" ? "bg-yellow-500 dark:bg-yellow-400" :
            "bg-blue-500 dark:bg-blue-400"
          )}
        />
      )}
    </motion.div>
  );
}

export function ToastContainer() {
  const { state, dismissToast } = useAppStore();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence mode="popLayout">
        {state.toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
} 