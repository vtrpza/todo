"use client";

import { Task, TaskCategory, TaskPriority } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, Calendar, Timer, AlertTriangle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface TaskItemProps {
  task: Task;
  onGenerateSubtasks: (taskId: string) => void;
}

export function TaskItem({ task, onGenerateSubtasks }: TaskItemProps) {
  const { toggleTaskCompletion, deleteTask } = useAppStore();
  const [showOptions, setShowOptions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    // Adicionar efeito de confete quando concluir uma tarefa não concluída
    if (!task.completed) {
      // Trigger confetti animation
      const element = document.getElementById(`task-${task.id}`);
      if (element) {
        // Adicionar classe temporária para animar
        element.classList.add('task-complete-animation');
        
        // Remover após a animação terminar
        setTimeout(() => {
          element.classList.remove('task-complete-animation');
        }, 1000);
      }
    }
    
    toggleTaskCompletion(task.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  const handleGenerateSubtasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateSubtasks(task.id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Criar texto para compartilhar
    const shareText = `Tarefa: ${task.title}${task.category ? ` (${getCategoryName(task.category)})` : ''}${task.priority ? ` - Prioridade: ${priorityLabels[task.priority]}` : ''}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TaskHero - Compartilhar Tarefa',
          text: shareText,
        });
      } else {
        // Fallback para navegadores que não suportam a API de compartilhamento
        navigator.clipboard.writeText(shareText);
        // Aqui você pode mostrar um toast indicando que foi copiado para o clipboard
      }
    } catch (error) {
      console.error("Erro ao compartilhar tarefa:", error);
    }
  };

  const getCategoryName = (category: TaskCategory): string => {
    const categoryNames: Record<TaskCategory, string> = {
      [TaskCategory.WORK]: "Trabalho",
      [TaskCategory.PERSONAL]: "Pessoal",
      [TaskCategory.STUDY]: "Estudo",
      [TaskCategory.HEALTH]: "Saúde",
      [TaskCategory.LEISURE]: "Lazer",
      [TaskCategory.OTHER]: "Outros"
    };
    
    return categoryNames[category];
  };

  const categoryIcons: Record<TaskCategory, string> = {
    [TaskCategory.WORK]: "💼",
    [TaskCategory.PERSONAL]: "🏠",
    [TaskCategory.STUDY]: "📚",
    [TaskCategory.HEALTH]: "🏋️",
    [TaskCategory.LEISURE]: "🎮",
    [TaskCategory.OTHER]: "📌",
  };

  const priorityBadgeColors: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    [TaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    [TaskPriority.HIGH]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  const priorityLabels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: "Baixa",
    [TaskPriority.MEDIUM]: "Média",
    [TaskPriority.HIGH]: "Alta",
  };

  // Formatar data de vencimento se existir
  const formatDueDate = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = dueDate.getDate() === today.getDate() &&
                  dueDate.getMonth() === today.getMonth() &&
                  dueDate.getFullYear() === today.getFullYear();
    
    const isTomorrow = dueDate.getDate() === tomorrow.getDate() &&
                      dueDate.getMonth() === tomorrow.getMonth() &&
                      dueDate.getFullYear() === tomorrow.getFullYear();
    
    const isPastDue = dueDate < today;
    
    const formattedDate = dueDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    
    if (isToday) return { text: 'Hoje', urgent: false };
    if (isTomorrow) return { text: 'Amanhã', urgent: false };
    if (isPastDue) return { text: formattedDate, urgent: true };
    
    return { text: formattedDate, urgent: false };
  };
  
  const dueInfo = task.dueDate ? formatDueDate() : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      transition={{ 
        duration: 0.25, 
        ease: "easeOut" 
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "flex items-start gap-2 p-3 mb-2 rounded-lg bg-card transition-all duration-200",
        task.parent ? "ml-6 border-l-2 border-l-primary/30" : "",
        task.completed ? "opacity-70" : "",
        showOptions ? "ring-1 ring-primary/20" : "",
        isHovered && !showOptions ? "shadow-sm" : "",
        task.priority === TaskPriority.HIGH && !task.completed ? "border-l-2 border-l-red-400" : ""
      )}
      onClick={() => setShowOptions(!showOptions)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`task-${task.id}`}
    >
      <Checkbox 
        checked={task.completed} 
        onCheckedChange={handleToggle} 
        className={cn(
          "mt-0.5 transition-all duration-300",
          task.completed ? "opacity-50" : "",
          "hover:scale-110"
        )} 
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <h3 
            className={cn(
              "font-medium break-words transition-all duration-200",
              task.completed ? "line-through text-muted-foreground" : ""
            )}
          >
            {task.title}
          </h3>
          
          {task.category && !task.completed && (
            <motion.span 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center text-xs bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors duration-200"
              title={task.category}
            >
              {categoryIcons[task.category]}
            </motion.span>
          )}
          
          {task.priority && !task.completed && (
            <motion.span 
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "inline-flex items-center text-xs px-1.5 py-0.5 rounded transition-all duration-200",
                priorityBadgeColors[task.priority]
              )}
            >
              {task.priority === TaskPriority.HIGH && <AlertTriangle size={12} className="mr-1" />}
              {priorityLabels[task.priority]}
            </motion.span>
          )}
        </div>
        
        {(dueInfo || task.estimatedTime) && !task.completed && (
          <div className="flex flex-wrap gap-2 mt-1.5 mb-1">
            {dueInfo && (
              <motion.span 
                initial={{ y: -2, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "inline-flex items-center text-xs transition-colors duration-200",
                  dueInfo.urgent 
                    ? "text-destructive font-medium" 
                    : "text-muted-foreground"
                )}
              >
                <Calendar size={12} className={cn("mr-1", dueInfo.urgent && "animate-pulse")} />
                {dueInfo.text}
              </motion.span>
            )}
            
            {task.estimatedTime && (
              <motion.span 
                initial={{ y: -2, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center text-xs text-muted-foreground"
              >
                <Timer size={12} className="mr-1" />
                {task.estimatedTime} min
              </motion.span>
            )}
          </div>
        )}
        
        <AnimatePresence>
          {showOptions && !task.completed && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2 mt-3"
            >
              {!task.isSubtask && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs transition-all hover:shadow-sm hover:translate-y-[-1px]"
                  onClick={handleGenerateSubtasks}
                >
                  <Sparkles size={14} className="mr-1 animate-pulse" /> 
                  Dividir em subtarefas
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs transition-all hover:shadow-sm hover:translate-y-[-1px]" 
                onClick={handleShare}
              >
                <Share2 size={14} className="mr-1" /> 
                Compartilhar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-7 text-xs transition-all hover:shadow-sm hover:translate-y-[-1px]" 
                onClick={handleDelete}
              >
                <Trash2 size={14} className="mr-1" /> 
                Remover
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isHovered && !showOptions && !task.completed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mt-2"
          >
            Clique para mais opções
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 