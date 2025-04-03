"use client";

import { useAppStore } from "@/lib/store";
import { TaskItem } from "./TaskItem";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Task } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ClipboardList, AlertTriangle, Search, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFilterContext } from "@/lib/filterContext";

// Componente de item de tarefa arrastável
interface SortableTaskItemProps {
  task: Task;
  onGenerateSubtasks: (taskId: string) => void;
  isRecent: boolean;
  isLoading: boolean;
  renderSubtasks: (taskId: string) => React.ReactNode;
}

function SortableTaskItem({ task, onGenerateSubtasks, isRecent, isLoading, renderSubtasks }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'cursor-grabbing' : ''}`}
    >
      <motion.div 
        className="flex items-start"
        animate={isRecent ? {
          boxShadow: ["0 0 0 0 rgba(var(--primary-rgb), 0)", "0 0 0 8px rgba(var(--primary-rgb), 0.3)", "0 0 0 0 rgba(var(--primary-rgb), 0)"],
        } : {}}
        transition={{ duration: 1.5 }}
      >
        <button
          className="mr-2 p-1 mt-1 opacity-40 hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-opacity duration-200"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1">
          <TaskItem 
            task={task} 
            onGenerateSubtasks={onGenerateSubtasks} 
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
          
          {renderSubtasks(task.id)}
        </div>
      </motion.div>
    </div>
  );
}

export function TaskList() {
  const { state, addSubTasks } = useAppStore();
  const { searchTerm, filters } = useFilterContext();
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAddedTask, setRecentlyAddedTask] = useState<string | null>(null);
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  const tasksRef = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Configurar sensores para arrastar e soltar
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Manipulador para o fim do arrastar
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setTaskOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Obter tarefas filtradas com base nos critérios de busca e filtros
  const getVisibleTasks = useCallback((): Task[] => {
    // Se não houver filtros ativos, mostrar todas as tarefas principais
    if (!searchTerm && 
        filters.categories.length === 0 && 
        filters.priorities.length === 0 && 
        !filters.onlyPending && 
        !filters.dueSoon) {
      return state.tasks.filter(task => !task.parent);
    }
    
    // Primeiro filtrar por termo de busca 
    let visibleTasks = searchTerm 
      ? state.tasks.filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase())) 
      : [...state.tasks];
    
    // Aplicar filtros adicionais
    if (filters.categories.length > 0) {
      visibleTasks = visibleTasks.filter(task => 
        task.category && filters.categories.includes(task.category)
      );
    }
    
    if (filters.priorities.length > 0) {
      visibleTasks = visibleTasks.filter(task => 
        task.priority && filters.priorities.includes(task.priority)
      );
    }
    
    if (filters.onlyPending) {
      visibleTasks = visibleTasks.filter(task => !task.completed);
    }
    
    if (filters.dueSoon) {
      const now = Date.now();
      const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
      visibleTasks = visibleTasks.filter(task => 
        task.dueDate && task.dueDate > now && task.dueDate <= threeDaysFromNow && !task.completed
      );
    }
    
    // Retornar apenas tarefas principais, não subtarefas
    return visibleTasks.filter(task => !task.parent);
  }, [state.tasks, searchTerm, filters]);

  // Obter tarefas visíveis
  const visibleTasks = useMemo(() => getVisibleTasks(), [getVisibleTasks]);

  // Inicializar e atualizar ordem das tarefas
  useEffect(() => {
    // Obter IDs das tarefas principais
    const mainTaskIds = visibleTasks.map(task => task.id);
    
    // Verificar se temos todas as tarefas atuais na ordem
    const hasAllTasks = mainTaskIds.every(id => taskOrder.includes(id));
    
    // Verificar se taskOrder tem tarefas que não existem mais
    const hasOnlyExistingTasks = taskOrder.every(id => mainTaskIds.includes(id));
    
    // Se a ordem estiver vazia ou desatualizada, reinicialize-a
    if (taskOrder.length === 0 || !hasAllTasks || !hasOnlyExistingTasks) {
      setTaskOrder(mainTaskIds);
    }
  }, [state.tasks, searchTerm, filters, taskOrder, visibleTasks]);

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

  // Ordenar tarefas: primeiro ordenar pelo array de ordem, depois pelo estado de conclusão e data de criação
  const sortedTasks = useMemo(() => {
    // Primeiro filtrar por estado de conclusão
    const incompleteTasksById: Record<string, Task> = {};
    const completedTasksById: Record<string, Task> = {};
    
    visibleTasks.forEach(task => {
      if (task.completed) {
        completedTasksById[task.id] = task;
      } else {
        incompleteTasksById[task.id] = task;
      }
    });
    
    // Pegar IDs de tarefas ordenadas que existem no estado visível atual
    const sortedTaskIds = taskOrder.filter(id => 
      incompleteTasksById[id] || completedTasksById[id]
    );
    
    // Para quaisquer tarefas que não estejam na ordem salva (novas tarefas), adicione-as no final
    visibleTasks.forEach(task => {
      if (!sortedTaskIds.includes(task.id)) {
        sortedTaskIds.push(task.id);
      }
    });
    
    // Reordenar tarefas de acordo com a ordem definida
    return sortedTaskIds
      .map(id => incompleteTasksById[id] || completedTasksById[id])
      .filter(Boolean)
      .sort((a, b) => {
        // Tarefas não concluídas primeiro
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        // Se ambas estiverem no mesmo estado, usar a ordem personalizada
        return 0;
      });
  }, [visibleTasks, taskOrder]);

  // Função para renderizar subtarefas
  const renderSubtasks = (parentId: string) => {
    // Encontrar subtarefas para esta tarefa
    const subtasks = state.tasks.filter(t => t.parent === parentId);
    
    // Ordenar subtarefas: não concluídas primeiro
    const sortedSubtasks = [...subtasks].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return 0;
    });

    return (
      <AnimatePresence mode="popLayout">
        {sortedSubtasks.map(subtask => (
          <motion.div
            key={subtask.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="ml-6"
          >
            <TaskItem 
              key={subtask.id} 
              task={subtask} 
              onGenerateSubtasks={handleGenerateSubtasks} 
            />
          </motion.div>
        ))}
      </AnimatePresence>
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
            {searchTerm || filters.categories.length > 0 || filters.priorities.length > 0 || filters.onlyPending || filters.dueSoon ? (
              <>
                <Search size={48} className="mb-3 text-muted-foreground/50" />
                <p className="text-lg mb-1">Nenhuma tarefa encontrada</p>
                <p className="text-sm text-muted-foreground">Tente outros filtros ou termos de busca</p>
              </>
            ) : (
              <>
                <ClipboardList size={48} className="mb-3 text-muted-foreground/50" />
                <p className="text-lg mb-1">Nenhuma tarefa adicionada</p>
                <p className="text-sm text-muted-foreground">Comece adicionando uma tarefa acima!</p>
              </>
            )}
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
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
                    ref={(el: HTMLDivElement | null) => {
                      tasksRef.current[task.id] = el;
                    }}
                  >
                    <SortableTaskItem
                      task={task}
                      onGenerateSubtasks={handleGenerateSubtasks}
                      isRecent={recentlyAddedTask === task.id}
                      isLoading={loadingTaskId === task.id}
                      renderSubtasks={renderSubtasks}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </SortableContext>
          </DndContext>
        )}
      </AnimatePresence>
    </div>
  );
} 