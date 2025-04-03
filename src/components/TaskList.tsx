"use client";

import { useAppStore } from "@/lib/store";
import { TaskItem } from "./TaskItem";
import { useState, useRef, useEffect } from "react";
import { Task } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ClipboardList, AlertTriangle } from "lucide-react";

export function TaskList() {
  const { state, addSubTasks } = useAppStore();
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAddedTask, setRecentlyAddedTask] = useState<string | null>(null);
  const tasksRef = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Monitor tasks to detect newly added ones
  useEffect(() => {
    const mainTasks = state.tasks.filter(task => !task.parent);
    
    if (mainTasks.length > 0) {
      const latestTask = mainTasks.reduce((latest, current) => 
        current.createdAt > latest.createdAt ? current : latest
      );
      
      // If this is a new task that wasn't tracked before
      if (latestTask && !recentlyAddedTask && Date.now() - latestTask.createdAt < 2000) {
        setRecentlyAddedTask(latestTask.id);
        
        // Scroll to the new task
        setTimeout(() => {
          if (tasksRef.current[latestTask.id]) {
            tasksRef.current[latestTask.id]?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'center'
            });
          }
          
          // Reset after a delay
          setTimeout(() => {
            setRecentlyAddedTask(null);
          }, 2000);
        }, 100);
      }
    }
  }, [state.tasks, recentlyAddedTask]);

  const handleGenerateSubtasks = async (taskId: string) => {
    try {
      setLoadingTaskId(taskId);
      setError(null);
      
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch("/api/generate-subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskTitle: task.title }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar subtarefas");
      }

      const data = await response.json();
      
      // Adicionar as subtarefas à tarefa principal
      if (data.subtasks && data.subtasks.length > 0) {
        addSubTasks(taskId, data.subtasks);
        
        // Highlight the parent task after adding subtasks
        setRecentlyAddedTask(taskId);
        setTimeout(() => setRecentlyAddedTask(null), 2000);
      } else {
        setError("Não foi possível gerar subtarefas para esta tarefa");
      }
    } catch (err) {
      setError("Erro ao gerar subtarefas. Tente novamente.");
      console.error(err);
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Filtrar tarefas principais (não são subtarefas)
  const mainTasks = state.tasks.filter(task => !task.parent);

  // Ordenar tarefas: primero não concluídas, depois concluídas
  const sortedTasks = [...mainTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return b.createdAt - a.createdAt; // Mais recentes primeiro
  });

  // Função para renderizar uma tarefa e suas subtarefas
  const renderTaskWithSubtasks = (task: Task) => {
    const isLoading = loadingTaskId === task.id;
    const isRecent = recentlyAddedTask === task.id;
    
    // Encontrar subtarefas para esta tarefa
    const subtasks = state.tasks.filter(t => t.parent === task.id);
    
    // Ordenar subtarefas: não concluídas primeiro
    const sortedSubtasks = [...subtasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return 0;
    });

    return (
      <motion.div 
        key={task.id} 
        className="relative"
        initial={false}
        animate={isRecent ? {
          boxShadow: ["0 0 0 0 rgba(var(--primary-rgb), 0)", "0 0 0 8px rgba(var(--primary-rgb), 0.3)", "0 0 0 0 rgba(var(--primary-rgb), 0)"],
        } : {}}
        transition={{ duration: 1.5 }}
        ref={el => tasksRef.current[task.id] = el}
      >
        <TaskItem 
          task={task} 
          onGenerateSubtasks={handleGenerateSubtasks} 
        />
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 flex items-center gap-2 text-sm text-muted-foreground mb-2 p-2"
          >
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Gerando subtarefas com IA...</span>
            </div>
          </motion.div>
        )}
        
        <AnimatePresence mode="popLayout">
          {sortedSubtasks.map(subtask => (
            <motion.div
              key={subtask.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              <TaskItem 
                key={subtask.id} 
                task={subtask} 
                onGenerateSubtasks={handleGenerateSubtasks} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md mb-3"
          >
            <AlertTriangle size={16} className="flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {sortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-muted-foreground py-12 border border-dashed rounded-lg flex flex-col items-center"
          >
            <ClipboardList size={48} className="mb-3 text-muted-foreground/50" />
            <p className="text-lg mb-1">Nenhuma tarefa adicionada</p>
            <p className="text-sm text-muted-foreground">Comece adicionando uma tarefa acima!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
            transition={{ staggerChildren: 0.1 }}
          >
            {sortedTasks.map(task => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderTaskWithSubtasks(task)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 