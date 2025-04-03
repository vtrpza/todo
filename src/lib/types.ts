export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  parent?: string; // ID da tarefa pai, se for uma subtask
  isSubtask?: boolean;
  category?: TaskCategory; // Categoria da tarefa
  estimatedTime?: number; // Tempo estimado em minutos
  priority?: TaskPriority; // Prioridade da tarefa
  dueDate?: number; // Data de vencimento (timestamp)
}

// Enum para categorias de tarefas
export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  STUDY = 'study',
  HEALTH = 'health',
  LEISURE = 'leisure',
  OTHER = 'other'
}

// Enum para prioridades
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Tipos para Toast notifications
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // Duration in milliseconds
  createdAt: number;
}

export interface GamificationState {
  points: number;
  level: number;
  streak: number;
  lastTaskCompletedAt?: number;
  streakStartDate?: number;
  badges: Badge[];
  dailyChallenges: Challenge[]; // Desafios diários
  weeklyGoals: Goal[]; // Metas semanais
  achievements: Achievement[]; // Conquistas desbloqueadas
  totalTasksCompleted: number; // Total de tarefas concluídas
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: number;
  icon?: string;
}

// Interface para desafios diários
export interface Challenge {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  expiresAt: number;
  pointsReward: number;
  type: 'task_completion' | 'streak' | 'category_focus';
  requirement: number; // Número para completar o desafio
  progress: number; // Progresso atual
  category?: TaskCategory; // Opcional, para desafios específicos de categoria
}

// Interface para metas semanais
export interface Goal {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  startDate: number;
  endDate: number;
  pointsReward: number;
  type: 'task_completion' | 'streak' | 'category_focus';
  requirement: number;
  progress: number;
}

// Interface para conquistas
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  type: 'streak' | 'task_count' | 'level' | 'category_master';
  requirement: number;
}

export interface UserSettings {
  name?: string;
  avatar?: string;
  theme: 'light' | 'dark' | 'system';
}

export interface AppState {
  tasks: Task[];
  gamification: GamificationState;
  settings: UserSettings;
  toasts: Toast[]; // Toast notifications
} 