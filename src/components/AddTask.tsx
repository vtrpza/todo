"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { PlusCircle, Loader2, Calendar, Brain, Timer, Check, X } from "lucide-react";
import { TaskCategory, TaskPriority } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AddTask() {
  const { addTask, state } = useAppStore();
  const [title, setTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<TaskCategory>(TaskCategory.OTHER);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  
  // Estados para IA
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSuggestingPriority, setIsSuggestingPriority] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // Estado para animação de sucesso
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask(
        title.trim(), 
        category, 
        priority, 
        estimatedTime || undefined, 
        dueDate ? dueDate.getTime() : undefined
      );
      setTitle("");
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 1500);
    }
  };

  const resetForm = () => {
    setCategory(TaskCategory.OTHER);
    setPriority(TaskPriority.MEDIUM);
    setDueDate(null);
    setEstimatedTime(null);
    // Opcionalmente, fechar o formulário
    // setShowForm(false);
  };

  const toggleForm = () => {
    setShowForm((prev) => !prev);
    if (!showForm) {
      resetForm();
    }
  };

  // Gerar sugestões usando IA quando o título é digitado e tem mais de 5 caracteres
  useEffect(() => {
    const debouncedGenerateSuggestions = setTimeout(() => {
      if (title.length > 5 && aiEnabled) {
        generateAISuggestions();
      }
    }, 800);

    return () => clearTimeout(debouncedGenerateSuggestions);
  }, [title, aiEnabled]);

  // Função para gerar sugestões usando IA
  const generateAISuggestions = async () => {
    try {
      // Gerar estimativa de tempo
      setIsEstimating(true);
      const timeEstimationPromise = fetch("/api/estimate-task-time", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          taskTitle: title,
          category: category
        }),
      }).then(res => res.json());

      // Gerar sugestão de prioridade
      setIsSuggestingPriority(true);
      const existingTaskTitles = state.tasks
        .filter(t => !t.completed && !t.parent)
        .map(t => t.title);
      
      const prioritySuggestionPromise = fetch("/api/suggest-priority", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          taskTitle: title,
          existingTasks: existingTaskTitles,
          dueDate: dueDate ? dueDate.toISOString() : undefined
        }),
      }).then(res => res.json());

      // Executar as requisições em paralelo
      const [timeEstimation, prioritySuggestion] = await Promise.all([
        timeEstimationPromise,
        prioritySuggestionPromise
      ]);

      // Atualizar estados com as sugestões
      if (timeEstimation && 'estimatedTimeMinutes' in timeEstimation) {
        setEstimatedTime(timeEstimation.estimatedTimeMinutes);
      }
      
      if (prioritySuggestion && 'priority' in prioritySuggestion) {
        const suggestedPriority = prioritySuggestion.priority as TaskPriority;
        if (Object.values(TaskPriority).includes(suggestedPriority)) {
          setPriority(suggestedPriority);
        }
      }
    } catch (error) {
      console.error("Erro ao gerar sugestões com IA:", error);
    } finally {
      setIsEstimating(false);
      setIsSuggestingPriority(false);
    }
  };

  const categoryLabels = {
    [TaskCategory.WORK]: { label: "Trabalho", icon: "💼" },
    [TaskCategory.PERSONAL]: { label: "Pessoal", icon: "🏠" },
    [TaskCategory.STUDY]: { label: "Estudo", icon: "📚" },
    [TaskCategory.HEALTH]: { label: "Saúde", icon: "🏋️" },
    [TaskCategory.LEISURE]: { label: "Lazer", icon: "🎮" },
    [TaskCategory.OTHER]: { label: "Outros", icon: "📌" },
  };

  const priorityLabels = {
    [TaskPriority.LOW]: { 
      label: "Baixa", 
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
    },
    [TaskPriority.MEDIUM]: { 
      label: "Média", 
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" 
    },
    [TaskPriority.HIGH]: { 
      label: "Alta", 
      color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" 
    },
  };

  return (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="add-button"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Button 
              onClick={toggleForm} 
              variant="outline" 
              className="w-full flex items-center gap-2 border-dashed hover:border-primary/50 group"
            >
              <PlusCircle size={16} className="group-hover:text-primary transition-colors duration-200" />
              <span className="group-hover:text-primary transition-colors duration-200">Adicionar nova tarefa</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="task-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-card border rounded-lg p-4 shadow-sm"
          >
            {showSuccess ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5 }}
                  className="bg-green-100 dark:bg-green-900 rounded-full p-3 mb-3 text-green-600 dark:text-green-300"
                >
                  <Check size={24} />
                </motion.div>
                <h3 className="text-lg font-medium mb-1">Tarefa adicionada!</h3>
                <p className="text-sm text-muted-foreground">Sua tarefa foi adicionada com sucesso.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <motion.input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="O que você precisa fazer?"
                      className="w-full p-2 border rounded bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      autoFocus
                      animate={{ boxShadow: title ? "0 2px 5px rgba(0,0,0,0.1)" : "none" }}
                    />
                    {(isEstimating || isSuggestingPriority) && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="text-xs text-muted-foreground mr-1">IA sugerindo</span>
                        <Loader2 size={14} className="animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="text-sm font-medium mb-1 block">Categoria</label>
                      <div className="grid grid-cols-3 gap-1">
                        {Object.values(TaskCategory).map((cat) => (
                          <motion.button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={`flex items-center justify-center p-2 rounded text-xs font-medium transition-all duration-200 ${
                              category === cat 
                                ? "bg-primary/10 border-primary border" 
                                : "bg-muted border-transparent border hover:bg-muted/80"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            animate={{ 
                              y: category === cat ? [0, -2, 0] : 0,
                              transition: { duration: 0.3 }
                            }}
                          >
                            <span className="mr-1">{categoryLabels[cat].icon}</span>
                            {categoryLabels[cat].label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium">Prioridade</label>
                        {isSuggestingPriority && (
                          <span className="text-xs flex items-center text-muted-foreground">
                            <Brain size={12} className="mr-1 animate-pulse" /> IA analisando
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {Object.values(TaskPriority).map((pri) => (
                          <motion.button
                            key={pri}
                            type="button"
                            onClick={() => setPriority(pri)}
                            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all duration-200 ${
                              priority === pri 
                                ? `${priorityLabels[pri].color} border-current border` 
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            animate={{ 
                              y: priority === pri ? [0, -2, 0] : 0,
                              transition: { duration: 0.3 }
                            }}
                          >
                            {priorityLabels[pri].label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium">Data de vencimento</label>
                      </div>
                      <div className="flex items-center group">
                        <Calendar size={16} className="mr-2 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <input
                          type="date"
                          value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setDueDate(value ? new Date(value) : null);
                          }}
                          className="bg-muted p-2 rounded text-sm w-full focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:bg-muted/80"
                        />
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium">Tempo estimado</label>
                        {isEstimating && (
                          <span className="text-xs flex items-center text-muted-foreground">
                            <Timer size={12} className="mr-1 animate-pulse" /> IA estimando
                          </span>
                        )}
                      </div>
                      <div className="flex items-center group">
                        <Timer size={16} className="mr-2 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          placeholder="Minutos"
                          value={estimatedTime || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setEstimatedTime(isNaN(value) ? null : value);
                          }}
                          className="bg-muted p-2 rounded text-sm w-full focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:bg-muted/80"
                        />
                      </div>
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="flex items-center mt-2 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="button"
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className={cn(
                        "flex items-center text-xs mr-2 p-1 rounded hover:bg-muted/50 transition-all duration-200",
                        aiEnabled ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <motion.div 
                        className={cn(
                          "w-8 h-4 rounded-full mr-2 relative",
                          aiEnabled ? "bg-primary" : "bg-muted"
                        )}
                        animate={{ backgroundColor: aiEnabled ? "var(--primary)" : "var(--muted)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div 
                          className="absolute w-3 h-3 rounded-full bg-background top-0.5"
                          animate={{ 
                            x: aiEnabled ? 18 : 2,
                            backgroundColor: "var(--background)"
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        />
                      </motion.div>
                      <span className="font-medium">Sugestões de IA</span>
                    </button>
                    
                    {aiEnabled && (
                      <motion.button
                        type="button"
                        onClick={generateAISuggestions}
                        disabled={title.length < 5 || isEstimating || isSuggestingPriority}
                        className="text-xs text-primary underline decoration-dotted flex items-center disabled:text-muted-foreground disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Brain size={12} className="mr-1" />
                        Regenerar sugestões
                      </motion.button>
                    )}
                  </motion.div>
                  
                  <motion.div 
                    className="flex gap-2 justify-end mt-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={toggleForm}
                      className="flex items-center gap-1"
                    >
                      <X size={16} />
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!title.trim()}
                      className="flex items-center gap-1 relative overflow-hidden group"
                    >
                      <motion.span
                        initial={false}
                        animate={{ 
                          x: title.trim() ? [0, -4, 0] : 0 
                        }}
                        transition={{ 
                          repeat: title.trim() ? Infinity : 0, 
                          repeatDelay: 5,
                          duration: 0.5 
                        }}
                      >
                        <PlusCircle size={16} className="mr-1" />
                      </motion.span>
                      Adicionar
                      {title.trim() && (
                        <motion.span
                          className="absolute inset-0 bg-primary/10"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ 
                            repeat: Infinity, 
                            repeatDelay: 3,
                            duration: 0.8, 
                            ease: "easeInOut" 
                          }}
                        />
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 