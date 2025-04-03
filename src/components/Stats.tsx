"use client";

import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { BarChart, BarChart3, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { TaskCategory } from "@/lib/types";

export function Stats() {
  const { state } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Calcular estatísticas gerais
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // Calcular tempo médio de conclusão
  const tasksWithCompletion = state.tasks.filter(t => t.completed && t.completedAt && !t.isSubtask);
  let avgCompletionTime = 0;
  
  if (tasksWithCompletion.length > 0) {
    const totalCompletionTime = tasksWithCompletion.reduce((sum, task) => {
      const completionTime = task.completedAt! - task.createdAt;
      return sum + completionTime;
    }, 0);
    
    avgCompletionTime = totalCompletionTime / tasksWithCompletion.length;
  }
  
  // Formatar tempo médio de conclusão
  const formatAvgTime = () => {
    const hours = Math.floor(avgCompletionTime / (1000 * 60 * 60));
    const minutes = Math.floor((avgCompletionTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} dias`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} minutos`;
    }
  };
  
  // Calcular distribuição por categoria
  const categoryStats: Record<TaskCategory, { count: number, completed: number }> = {
    [TaskCategory.WORK]: { count: 0, completed: 0 },
    [TaskCategory.PERSONAL]: { count: 0, completed: 0 },
    [TaskCategory.STUDY]: { count: 0, completed: 0 },
    [TaskCategory.HEALTH]: { count: 0, completed: 0 },
    [TaskCategory.LEISURE]: { count: 0, completed: 0 },
    [TaskCategory.OTHER]: { count: 0, completed: 0 },
  };
  
  state.tasks.forEach(task => {
    if (task.category) {
      categoryStats[task.category].count++;
      if (task.completed) {
        categoryStats[task.category].completed++;
      }
    }
  });
  
  // Nomes das categorias
  const categoryNames: Record<TaskCategory, string> = {
    [TaskCategory.WORK]: "Trabalho",
    [TaskCategory.PERSONAL]: "Pessoal",
    [TaskCategory.STUDY]: "Estudo",
    [TaskCategory.HEALTH]: "Saúde",
    [TaskCategory.LEISURE]: "Lazer",
    [TaskCategory.OTHER]: "Outros"
  };
  
  // Ícones das categorias
  const categoryIcons: Record<TaskCategory, string> = {
    [TaskCategory.WORK]: "💼",
    [TaskCategory.PERSONAL]: "🏠",
    [TaskCategory.STUDY]: "📚",
    [TaskCategory.HEALTH]: "🏋️",
    [TaskCategory.LEISURE]: "🎮",
    [TaskCategory.OTHER]: "📌",
  };

  return (
    <div className="fixed bottom-4 left-4 z-10">
      <Button 
        variant="default" 
        size="icon"
        className="rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BarChart3 size={20} />
      </Button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-0 mb-2 p-4 bg-card border rounded-lg shadow-lg w-72"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Estatísticas</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <BarChart size={18} className="mb-1 text-primary" />
                <div className="text-lg font-bold">{completedTasks}</div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <Clock size={18} className="mb-1 text-primary" />
                <div className="text-lg font-bold">{completionRate.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Conclusão</div>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                <Calendar size={18} className="mb-1 text-primary" />
                <div className="text-lg font-bold">{state.gamification.streak}</div>
                <div className="text-xs text-muted-foreground">Sequência</div>
              </div>
            </div>
            
            {/* Tempo médio */}
            {tasksWithCompletion.length > 0 && (
              <div className="flex items-center p-2 bg-muted/50 rounded-md">
                <div className="mr-2">⏱️</div>
                <div>
                  <div className="text-sm font-medium">Tempo médio para conclusão</div>
                  <div className="text-xs text-muted-foreground">{formatAvgTime()}</div>
                </div>
              </div>
            )}
            
            {/* Distribuição por categoria */}
            <div>
              <h4 className="text-sm font-medium mb-2">Distribuição por categoria</h4>
              <div className="space-y-2">
                {Object.entries(categoryStats)
                  .filter(([, stats]) => stats.count > 0)
                  .sort(([, statsA], [, statsB]) => statsB.count - statsA.count)
                  .map(([category, stats]) => {
                    const completionPercent = stats.count > 0 
                      ? (stats.completed / stats.count) * 100 
                      : 0;
                    
                    return (
                      <div key={category} className="text-xs">
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <span className="mr-1">
                              {categoryIcons[category as TaskCategory]}
                            </span>
                            {categoryNames[category as TaskCategory]}
                          </div>
                          <div className="text-muted-foreground">
                            {stats.completed}/{stats.count}
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercent}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            
            {/* Total de pontos e nível */}
            <div className="flex justify-between p-2 bg-primary/10 rounded-md">
              <div className="flex items-center">
                <CheckCircle2 size={18} className="mr-2 text-primary" />
                <div>
                  <div className="text-sm font-medium">Total de pontos</div>
                  <div className="text-xs text-muted-foreground">
                    {state.gamification.points} XP
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">
                {state.gamification.level}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 