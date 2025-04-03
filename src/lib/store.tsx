"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  AppState, 
  GamificationState, 
  Task, 
  UserSettings, 
  TaskCategory, 
  TaskPriority,
  Challenge,
  Achievement,
  Toast,
  ToastType
} from "./types";

// Estado inicial da aplicação
const initialGamificationState: GamificationState = {
  points: 0,
  level: 1,
  streak: 0,
  badges: [],
  dailyChallenges: [],
  weeklyGoals: [],
  achievements: [],
  totalTasksCompleted: 0,
};

const initialUserSettings: UserSettings = {
  theme: 'system',
};

const initialAppState: AppState = {
  tasks: [],
  gamification: initialGamificationState,
  settings: initialUserSettings,
  toasts: [],
};

// Tipo das ações do contexto
type AppContextType = {
  state: AppState;
  addTask: (title: string, category?: TaskCategory, priority?: TaskPriority, estimatedTime?: number, dueDate?: number) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  addSubTasks: (parentId: string, subtasks: string[]) => void;
  resetStreak: () => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateTaskCategory: (id: string, category: TaskCategory) => void;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  updateTaskDueDate: (id: string, dueDate: number) => void;
  updateTaskEstimatedTime: (id: string, estimatedTime: number) => void;
  generateDailyChallenge: () => void;
  completeChallenge: (id: string) => void;
  getTasksByCategory: (category: TaskCategory) => Task[];
  getFilteredTasks: (filters: { categories?: TaskCategory[], completed?: boolean, priority?: TaskPriority[] }) => Task[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  searchTasks: (term: string) => Task[];
};

// Criação do contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
};

// Provider do contexto
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialAppState);

  // Função para gerar um desafio diário
  const generateDailyChallenge = useCallback(() => {
    // Função auxiliar para obter nome legível da categoria
    const getCategoryName = (category: TaskCategory): string => {
      const categoryLabels: Record<TaskCategory, string> = {
        [TaskCategory.WORK]: "Trabalho",
        [TaskCategory.PERSONAL]: "Pessoal",
        [TaskCategory.STUDY]: "Estudo",
        [TaskCategory.HEALTH]: "Saúde",
        [TaskCategory.LEISURE]: "Lazer",
        [TaskCategory.OTHER]: "Outros"
      };
      return categoryLabels[category];
    };

    // Lista de modelos de desafios
    const challengeTemplates = [
      {
        title: "Concluir tarefas",
        description: "Complete [requirement] tarefas hoje",
        type: "task_completion" as const,
        requirement: () => Math.floor(Math.random() * 3) + 2, // 2-4 tarefas
        pointsReward: () => Math.floor(Math.random() * 20) + 10, // 10-30 pontos
      },
      {
        title: "Foco em categoria",
        description: "Complete [requirement] tarefas da categoria [category]",
        type: "category_focus" as const,
        requirement: () => Math.floor(Math.random() * 2) + 1, // 1-2 tarefas
        pointsReward: () => Math.floor(Math.random() * 15) + 15, // 15-30 pontos
        categories: Object.values(TaskCategory)
      }
    ];
    
    // Escolher um modelo aleatoriamente
    const templateIndex = Math.floor(Math.random() * challengeTemplates.length);
    const challengeTemplate = challengeTemplates[templateIndex];
    
    // Gerar requisito específico
    const requirement = challengeTemplate.requirement();
    const pointsReward = challengeTemplate.pointsReward();
    
    // Data de expiração (final do dia atual)
    const today = new Date();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime();
    
    // Criar desafio
    let category: TaskCategory | undefined;
    if (challengeTemplate.type === 'category_focus' && challengeTemplate.categories) {
      category = challengeTemplate.categories[
        Math.floor(Math.random() * challengeTemplate.categories.length)
      ];
    }
    
    const description = challengeTemplate.description
      .replace('[requirement]', requirement.toString())
      .replace('[category]', category ? `"${getCategoryName(category)}"` : '');
    
    const newChallenge: Challenge = {
      id: crypto.randomUUID(),
      title: challengeTemplate.title,
      description,
      completed: false,
      createdAt: Date.now(),
      expiresAt: endOfDay,
      pointsReward,
      type: challengeTemplate.type,
      requirement,
      progress: 0,
      category
    };
    
    setState(prev => ({
      ...prev,
      gamification: {
        ...prev.gamification,
        dailyChallenges: [...prev.gamification.dailyChallenges, newChallenge]
      }
    }));
  }, []);

  // Carregar dados do localStorage ao iniciar a aplicação
  useEffect(() => {
    const savedState = localStorage.getItem("todoApp");
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      } catch (error) {
        console.error("Error parsing stored state:", error);
      }
    }
    
    // Gerar um desafio diário se não existir
    if (!savedState || !JSON.parse(savedState).gamification.dailyChallenges?.length) {
      generateDailyChallenge();
    }
  }, [generateDailyChallenge]);

  // Salvar dados no localStorage quando o estado muda
  useEffect(() => {
    localStorage.setItem("todoApp", JSON.stringify(state));
  }, [state]);

  // Verificar streak diariamente
  useEffect(() => {
    const checkStreak = () => {
      if (!state.gamification.lastTaskCompletedAt) return;

      const now = new Date();
      const lastCompletion = new Date(state.gamification.lastTaskCompletedAt);
      
      // Se passou mais de 48 horas desde a última tarefa completada, resetar streak
      const hoursDiff = (now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 48) {
        resetStreak();
      }
    };

    // Verificar streak ao iniciar e a cada 6 horas
    checkStreak();
    const interval = setInterval(checkStreak, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.gamification.lastTaskCompletedAt]);

  // Verificar desafios diários
  useEffect(() => {
    const checkDailyChallenges = () => {
      const now = Date.now();
      
      // Verificar se há desafios expirados
      if (state.gamification.dailyChallenges.length > 0) {
        const hasExpiredChallenge = state.gamification.dailyChallenges.some(
          challenge => challenge.expiresAt < now
        );
        
        if (hasExpiredChallenge) {
          // Remover desafios expirados e gerar novos
          setState(prev => ({
            ...prev,
            gamification: {
              ...prev.gamification,
              dailyChallenges: prev.gamification.dailyChallenges.filter(
                challenge => challenge.expiresAt >= now
              )
            }
          }));
          
          generateDailyChallenge();
        }
      } else {
        // Se não há desafios, criar um novo
        generateDailyChallenge();
      }
    };
    
    checkDailyChallenges();
    const interval = setInterval(checkDailyChallenges, 60 * 60 * 1000); // Verificar a cada hora
    return () => clearInterval(interval);
  }, [state.gamification.dailyChallenges, generateDailyChallenge]);

  // Toast functionality
  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const newToast: Toast = {
      id: crypto.randomUUID(),
      message,
      type,
      duration,
      createdAt: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      toasts: [...prev.toasts, newToast]
    }));
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(newToast.id);
      }, duration);
    }
  };
  
  const dismissToast = (id: string) => {
    setState(prev => ({
      ...prev,
      toasts: prev.toasts.filter(toast => toast.id !== id)
    }));
  };
  
  // Clean up old toasts on interval
  useEffect(() => {
    const cleanupToasts = () => {
      const now = Date.now();
      setState(prev => ({
        ...prev,
        toasts: prev.toasts.filter(toast => {
          // Keep toasts without duration or that haven't expired yet
          return !toast.duration || (toast.createdAt + toast.duration > now);
        })
      }));
    };
    
    const interval = setInterval(cleanupToasts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Função para adicionar tarefa
  const addTask = (
    title: string, 
    category: TaskCategory = TaskCategory.OTHER,
    priority: TaskPriority = TaskPriority.MEDIUM,
    estimatedTime?: number,
    dueDate?: number
  ) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
      category,
      priority,
      estimatedTime,
      dueDate
    };

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    
    showToast(`Tarefa "${title}" adicionada`, 'success');
  };

  // Função para alternar conclusão de tarefa
  const toggleTaskCompletion = (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    const isCompleting = !task.completed;
    const updatedTasks = state.tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          completed: isCompleting,
          completedAt: isCompleting ? Date.now() : undefined,
        };
      }
      return t;
    });

    // Atualizar pontos, streak e outros elementos de gamificação
    let updatedGamification = { ...state.gamification };
    
    if (isCompleting) {
      // Adicionar pontos com base no tipo e prioridade da tarefa
      let pointsToAdd = task.isSubtask ? 5 : 10;
      
      // Bônus por prioridade
      if (task.priority === TaskPriority.HIGH) {
        pointsToAdd *= 1.5;
      } else if (task.priority === TaskPriority.LOW) {
        pointsToAdd *= 0.8;
      }
      
      // Arredondar para inteiro
      pointsToAdd = Math.round(pointsToAdd);
      
      // Verificar se é um novo dia para streak
      const now = new Date();
      const lastCompletionDate = updatedGamification.lastTaskCompletedAt
        ? new Date(updatedGamification.lastTaskCompletedAt)
        : null;
      
      const isNewDay = !lastCompletionDate || 
        now.getDate() !== lastCompletionDate.getDate() ||
        now.getMonth() !== lastCompletionDate.getMonth() ||
        now.getFullYear() !== lastCompletionDate.getFullYear();
      
      // Atualizar streak apenas se for um novo dia
      const newStreak = isNewDay ? updatedGamification.streak + 1 : updatedGamification.streak;
      
      // Calcular nível (a cada 100 pontos, sobe de nível)
      const newPoints = updatedGamification.points + pointsToAdd;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      // Incrementar o contador total de tarefas
      const totalTasksCompleted = updatedGamification.totalTasksCompleted + 1;
      
      updatedGamification = {
        ...updatedGamification,
        points: newPoints,
        level: newLevel,
        streak: newStreak,
        lastTaskCompletedAt: Date.now(),
        streakStartDate: updatedGamification.streakStartDate || Date.now(),
        totalTasksCompleted
      };
      
      // Atualizar progresso dos desafios
      updatedGamification.dailyChallenges = updatedGamification.dailyChallenges.map(challenge => {
        if (challenge.completed) return challenge;
        
        let updatedProgress = challenge.progress;
        
        // Atualizar progresso com base no tipo de desafio
        if (challenge.type === 'task_completion') {
          updatedProgress += 1;
        } else if (challenge.type === 'category_focus' && challenge.category === task.category) {
          updatedProgress += 1;
        }
        
        // Verificar se o desafio foi concluído
        const completed = updatedProgress >= challenge.requirement;
        
        // Se o desafio foi completado, adicionar pontos de recompensa
        if (completed && !challenge.completed) {
          updatedGamification.points += challenge.pointsReward;
        }
        
        return {
          ...challenge,
          progress: updatedProgress,
          completed: completed || challenge.completed
        };
      });
      
      // Verificar se desbloqueou novas conquistas
      const newAchievements = checkForNewAchievements(updatedGamification);
      updatedGamification.achievements = newAchievements;
      
      // Show appropriate toast
      showToast(`Tarefa "${task.title}" concluída! +${Math.round(pointsToAdd)} pontos`, 'success');
      
      // Check if level up occurred
      if (newLevel > updatedGamification.level) {
        showToast(`Você subiu para o nível ${newLevel}! 🎉`, 'info', 4000);
      }
      
      // Check if streak milestone reached
      if (newStreak > updatedGamification.streak && (newStreak === 3 || newStreak === 7 || newStreak % 10 === 0)) {
        showToast(`Sequência de ${newStreak} dias! Incrível! 🔥`, 'info', 4000);
      }
    } else {
      showToast(`Tarefa "${task.title}" desmarcada`, 'info');
    }

    setState((prev) => ({
      ...prev,
      tasks: updatedTasks,
      gamification: updatedGamification,
    }));
  };

  // Função para verificar novas conquistas
  const checkForNewAchievements = (gamification: GamificationState): Achievement[] => {
    // Conquistas padrão se ainda não existirem
    const existingAchievements = gamification.achievements || [];
    
    // Conquistas base para serem verificadas
    const baseAchievements: Achievement[] = [
      {
        id: 'first_task',
        name: 'Primeira Tarefa',
        description: 'Complete sua primeira tarefa',
        unlocked: gamification.totalTasksCompleted >= 1,
        unlockedAt: gamification.totalTasksCompleted >= 1 ? Date.now() : undefined,
        icon: '🎯',
        type: 'task_count',
        requirement: 1
      },
      {
        id: 'task_master_10',
        name: 'Mestre das Tarefas I',
        description: 'Complete 10 tarefas',
        unlocked: gamification.totalTasksCompleted >= 10,
        unlockedAt: gamification.totalTasksCompleted >= 10 ? Date.now() : undefined,
        icon: '🏆',
        type: 'task_count',
        requirement: 10
      },
      {
        id: 'task_master_50',
        name: 'Mestre das Tarefas II',
        description: 'Complete 50 tarefas',
        unlocked: gamification.totalTasksCompleted >= 50,
        unlockedAt: gamification.totalTasksCompleted >= 50 ? Date.now() : undefined,
        icon: '🌟',
        type: 'task_count',
        requirement: 50
      },
      {
        id: 'streak_3',
        name: 'Consistência',
        description: 'Mantenha um streak de 3 dias',
        unlocked: gamification.streak >= 3,
        unlockedAt: gamification.streak >= 3 ? Date.now() : undefined,
        icon: '🔥',
        type: 'streak',
        requirement: 3
      },
      {
        id: 'streak_7',
        name: 'Semana Perfeita',
        description: 'Mantenha um streak de 7 dias',
        unlocked: gamification.streak >= 7,
        unlockedAt: gamification.streak >= 7 ? Date.now() : undefined,
        icon: '📅',
        type: 'streak',
        requirement: 7
      },
      {
        id: 'level_5',
        name: 'Novato Avançado',
        description: 'Alcance o nível 5',
        unlocked: gamification.level >= 5,
        unlockedAt: gamification.level >= 5 ? Date.now() : undefined,
        icon: '⭐',
        type: 'level',
        requirement: 5
      },
      {
        id: 'level_10',
        name: 'Produtividade Profissional',
        description: 'Alcance o nível 10',
        unlocked: gamification.level >= 10,
        unlockedAt: gamification.level >= 10 ? Date.now() : undefined,
        icon: '🌠',
        type: 'level',
        requirement: 10
      }
    ];
    
    // Mesclar conquistas existentes com novas verificações
    const mergedAchievements = baseAchievements.map(baseAchievement => {
      const existingAchievement = existingAchievements.find(a => a.id === baseAchievement.id);
      
      if (existingAchievement && existingAchievement.unlocked) {
        return existingAchievement;
      }
      
      return baseAchievement;
    });
    
    return mergedAchievements;
  };

  // Função para excluir tarefa
  const deleteTask = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    // Também remover subtarefas associadas
    const taskIds = [id, ...state.tasks.filter(t => t.parent === id).map(t => t.id)];
    const subtasksCount = taskIds.length - 1;
    
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => !taskIds.includes(t.id)),
    }));
    
    if (subtasksCount > 0) {
      showToast(`Tarefa "${task.title}" e ${subtasksCount} subtarefa${subtasksCount > 1 ? 's' : ''} removidas`, 'warning');
    } else {
      showToast(`Tarefa "${task.title}" removida`, 'warning');
    }
  };

  // Função para adicionar subtarefas
  const addSubTasks = (parentId: string, subtaskTitles: string[]) => {
    const parentTask = state.tasks.find(t => t.id === parentId);
    if (!parentTask) return;
    
    const subtasks: Task[] = subtaskTitles.map((title) => ({
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
      parent: parentId,
      isSubtask: true,
      category: parentTask.category, // Herdar categoria da tarefa pai
      priority: parentTask.priority, // Herdar prioridade da tarefa pai
    }));

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, ...subtasks],
    }));
    
    showToast(`${subtaskTitles.length} subtarefas adicionadas`, 'success');
  };

  // Função para resetar streak
  const resetStreak = () => {
    setState((prev) => ({
      ...prev,
      gamification: {
        ...prev.gamification,
        streak: 0,
        streakStartDate: undefined,
      },
    }));
  };

  // Função para atualizar o tema
  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme
      }
    }));
    
    // Atualizar o tema no documento (para integração com next-themes)
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Remover classes existentes
      root.classList.remove('light', 'dark');
      
      // Adicionar nova classe, se não for 'system'
      if (theme !== 'system') {
        root.classList.add(theme);
      } else {
        // Para 'system', detectar preferência do sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(systemPrefersDark ? 'dark' : 'light');
      }
    }
  };
  
  // Função para atualizar categoria de uma tarefa
  const updateTaskCategory = (id: string, category: TaskCategory) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id 
          ? { ...task, category } 
          : task
      )
    }));
  };
  
  // Função para atualizar prioridade de uma tarefa
  const updateTaskPriority = (id: string, priority: TaskPriority) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id 
          ? { ...task, priority } 
          : task
      )
    }));
  };
  
  // Função para atualizar data de vencimento
  const updateTaskDueDate = (id: string, dueDate: number) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id 
          ? { ...task, dueDate } 
          : task
      )
    }));
  };
  
  // Função para atualizar tempo estimado
  const updateTaskEstimatedTime = (id: string, estimatedTime: number) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === id 
          ? { ...task, estimatedTime } 
          : task
      )
    }));
  };
  
  // Função para marcar um desafio como concluído
  const completeChallenge = (id: string) => {
    const challenge = state.gamification.dailyChallenges.find(c => c.id === id);
    if (!challenge || challenge.completed) return;
    
    const pointsReward = challenge.pointsReward;
    
    setState(prev => {
      const updatedChallenges = prev.gamification.dailyChallenges.map(c => {
        if (c.id === id) {
          return {
            ...c,
            completed: true
          };
        }
        return c;
      });
      
      return {
        ...prev,
        gamification: {
          ...prev.gamification,
          points: prev.gamification.points + pointsReward,
          dailyChallenges: updatedChallenges
        }
      };
    });
    
    showToast(`Desafio "${challenge.title}" concluído! +${challenge.pointsReward} pontos`, 'success', 4000);
  };
  
  // Função para obter tarefas por categoria
  const getTasksByCategory = (category: TaskCategory): Task[] => {
    return state.tasks.filter(task => task.category === category);
  };
  
  // Função para filtrar tarefas por termo de busca
  const searchTasks = (term: string): Task[] => {
    if (!term.trim()) return state.tasks;
    
    const lowercaseTerm = term.toLowerCase().trim();
    
    return state.tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseTerm)
    );
  };
  
  // Função para obter tarefas filtradas com critérios múltiplos
  const getFilteredTasks = (filters: { 
    searchTerm?: string; 
    categories?: TaskCategory[]; 
    priorities?: TaskPriority[]; 
    onlyPending?: boolean;
    dueSoon?: boolean;
  }): Task[] => {
    let filteredTasks = [...state.tasks];
    
    // Filtrar por termo de busca
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(term)
      );
    }
    
    // Filtrar por categorias
    if (filters.categories && filters.categories.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.category && filters.categories?.includes(task.category)
      );
    }
    
    // Filtrar por prioridades
    if (filters.priorities && filters.priorities.length > 0) {
      filteredTasks = filteredTasks.filter(task => 
        task.priority && filters.priorities?.includes(task.priority)
      );
    }
    
    // Filtrar apenas tarefas pendentes
    if (filters.onlyPending) {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    // Filtrar tarefas vencendo em breve (próximos 3 dias)
    if (filters.dueSoon) {
      const now = Date.now();
      const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
      
      filteredTasks = filteredTasks.filter(task => 
        task.dueDate && task.dueDate > now && task.dueDate <= threeDaysFromNow && !task.completed
      );
    }
    
    return filteredTasks;
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addTask,
        toggleTaskCompletion,
        deleteTask,
        addSubTasks,
        resetStreak,
        updateTheme,
        updateTaskCategory,
        updateTaskPriority,
        updateTaskDueDate,
        updateTaskEstimatedTime,
        generateDailyChallenge,
        completeChallenge,
        getTasksByCategory,
        getFilteredTasks,
        searchTasks,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}; 