"use client";

import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Flame, Gift, Sparkles, Star, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Achievement, Challenge } from "@/lib/types";

export function GamificationPanel() {
  const { state, completeChallenge } = useAppStore();
  
  const [showChallenges, setShowChallenges] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  
  // Calcular XP necessário para o próximo nível
  const currentLevel = state.gamification.level;
  const currentXP = state.gamification.points;
  const nextLevelXP = currentLevel * 100;
  const xpProgress = (currentXP % 100) / 100;
  
  // Buscar mensagem motivacional
  useEffect(() => {
    const fetchMotivationalMessage = async () => {
      try {
        const response = await fetch("/api/motivational-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            points: state.gamification.points,
            level: state.gamification.level,
            streak: state.gamification.streak,
            tasksCompleted: state.tasks.filter(t => 
              t.completed && 
              t.completedAt && 
              new Date(t.completedAt).toDateString() === new Date().toDateString()
            ).length
          }),
        });
        
        if (!response.ok) throw new Error("Failed to fetch motivational message");
        
        const data = await response.json();
        setMotivationalMessage(data.message);
      } catch (error) {
        console.error("Error fetching motivational message:", error);
        setMotivationalMessage("Continue assim, você está indo muito bem!");
      }
    };
    
    fetchMotivationalMessage();
  }, [state.gamification.points, state.gamification.level, state.gamification.streak, state.tasks]);
  
  // Filtrar conquistas desbloqueadas
  const unlockedAchievements = state.gamification.achievements.filter(a => a.unlocked);
  const lockedAchievements = state.gamification.achievements.filter(a => !a.unlocked);
  
  // Organizar desafios diários
  const activeChallenges = state.gamification.dailyChallenges.filter(c => !c.completed);
  const completedChallenges = state.gamification.dailyChallenges.filter(c => c.completed);
  
  return (
    <div className="bg-card rounded-lg p-4 mb-6 border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-primary h-6 w-6" />
            <h2 className="text-xl font-bold">Nível {currentLevel}</h2>
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{currentXP} XP</span>
              <span>{nextLevelXP} XP</span>
            </div>
            <Progress value={xpProgress * 100} className="h-2" />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center px-3 py-2 bg-primary/10 rounded-lg">
            <Flame className="h-5 w-5 mr-2 text-orange-500" />
            <div>
              <div className="text-sm font-medium">Sequência</div>
              <div className="text-xl font-bold">{state.gamification.streak} dias</div>
            </div>
          </div>
          
          <div className="flex items-center px-3 py-2 bg-primary/10 rounded-lg">
            <Award className="h-5 w-5 mr-2 text-primary" />
            <div>
              <div className="text-sm font-medium">Conquistas</div>
              <div className="text-xl font-bold">{unlockedAchievements.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {motivationalMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm italic text-center mb-4 text-muted-foreground pb-3 border-b"
        >
          &ldquo;{motivationalMessage}&rdquo;
        </motion.div>
      )}
      
      {/* Seção de Desafios Diários */}
      <div className="mt-4">
        <button 
          onClick={() => setShowChallenges(!showChallenges)}
          className="flex items-center justify-between w-full py-2 text-left font-semibold"
        >
          <div className="flex items-center">
            <Gift className="h-5 w-5 mr-2 text-primary" />
            <span>Desafios Diários</span>
          </div>
          <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
            {activeChallenges.length + completedChallenges.length}
          </span>
        </button>
        
        {showChallenges && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-7 mt-2 space-y-2"
          >
            {activeChallenges.map(challenge => (
              <ChallengeItem 
                key={challenge.id} 
                challenge={challenge} 
                onComplete={completeChallenge} 
              />
            ))}
            
            {completedChallenges.map(challenge => (
              <ChallengeItem 
                key={challenge.id} 
                challenge={challenge} 
                onComplete={completeChallenge}
                completed
              />
            ))}
            
            {activeChallenges.length === 0 && completedChallenges.length === 0 && (
              <div className="text-sm text-muted-foreground py-2">
                Nenhum desafio disponível no momento.
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Seção de Conquistas */}
      <div className="mt-4">
        <button 
          onClick={() => setShowAchievements(!showAchievements)}
          className="flex items-center justify-between w-full py-2 text-left font-semibold"
        >
          <div className="flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            <span>Conquistas</span>
          </div>
          <span className="text-xs bg-primary/20 px-2 py-1 rounded-full">
            {unlockedAchievements.length}/{state.gamification.achievements.length}
          </span>
        </button>
        
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-7 mt-2 space-y-2"
          >
            {/* Conquistas desbloqueadas */}
            {unlockedAchievements.length > 0 && (
              <>
                <h4 className="text-xs uppercase text-muted-foreground mt-2 mb-1">
                  Desbloqueadas
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {unlockedAchievements.map(achievement => (
                    <AchievementItem 
                      key={achievement.id} 
                      achievement={achievement} 
                      unlocked={true}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Conquistas bloqueadas */}
            {lockedAchievements.length > 0 && (
              <>
                <h4 className="text-xs uppercase text-muted-foreground mt-3 mb-1">
                  Bloqueadas
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {lockedAchievements.slice(0, 4).map(achievement => (
                    <AchievementItem 
                      key={achievement.id} 
                      achievement={achievement} 
                      unlocked={false}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Componente para exibir um desafio individual
interface ChallengeItemProps {
  challenge: Challenge;
  onComplete: (id: string) => void;
  completed?: boolean;
}

function ChallengeItem({ challenge, onComplete, completed }: ChallengeItemProps) {
  const progress = Math.min(challenge.progress, challenge.requirement);
  const percentComplete = (progress / challenge.requirement) * 100;
  
  return (
    <div className={cn(
      "p-2 rounded-md border border-border text-sm",
      completed ? "bg-muted/50 opacity-75" : ""
    )}>
      <div className="flex justify-between">
        <div>
          <div className="font-medium">{challenge.title}</div>
          <div className="text-muted-foreground text-xs">
            {challenge.description}
          </div>
          <div className="flex items-center mt-1.5 mb-1">
            <div className="flex-1 mr-2">
              <Progress value={percentComplete} className="h-1.5" />
            </div>
            <span className="text-xs text-muted-foreground">
              {progress}/{challenge.requirement}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end ml-2 min-w-[50px]">
          <div className="flex items-center mb-1">
            <Sparkles size={14} className="text-yellow-500 mr-1" />
            <span className="text-xs font-medium">+{challenge.pointsReward} XP</span>
          </div>
          
          {completed ? (
            <span className="text-xs inline-flex items-center text-green-600">
              <Check size={12} className="mr-0.5" /> Completo
            </span>
          ) : progress >= challenge.requirement ? (
            <button 
              onClick={() => onComplete(challenge.id)}
              className="text-xs bg-primary/90 hover:bg-primary text-white px-2 py-0.5 rounded"
            >
              Resgatar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Componente para exibir uma conquista individual
interface AchievementItemProps {
  achievement: Achievement;
  unlocked: boolean;
}

function AchievementItem({ achievement, unlocked }: AchievementItemProps) {
  return (
    <div className={cn(
      "p-2 rounded-md text-xs",
      unlocked 
        ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900/50" 
        : "bg-muted border border-muted-foreground/20 opacity-60"
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2 text-xl">
          {achievement.icon}
        </div>
        <div>
          <div className="font-semibold">{achievement.name}</div>
          <div className={unlocked ? "" : "text-muted-foreground"}>
            {achievement.description}
          </div>
          {unlocked && achievement.unlockedAt && (
            <div className="text-[10px] text-muted-foreground mt-1">
              Conquistado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 