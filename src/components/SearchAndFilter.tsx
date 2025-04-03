"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, Calendar, Tag } from "lucide-react";
import { TaskCategory, TaskPriority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFilterContext } from "@/lib/filterContext";

export function SearchAndFilter() {
  const { searchTerm, setSearchTerm, filters, setFilters } = useFilterContext();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleFilter = () => {
    setShowFilters(!showFilters);
  };

  const toggleCategoryFilter = (category: TaskCategory) => {
    setFilters((prev) => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter((c: TaskCategory) => c !== category)
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, category]
        };
      }
    });
  };

  const togglePriorityFilter = (priority: TaskPriority) => {
    setFilters((prev) => {
      if (prev.priorities.includes(priority)) {
        return {
          ...prev,
          priorities: prev.priorities.filter((p: TaskPriority) => p !== priority)
        };
      } else {
        return {
          ...prev,
          priorities: [...prev.priorities, priority]
        };
      }
    });
  };

  const togglePendingFilter = () => {
    setFilters((prev) => ({
      ...prev,
      onlyPending: !prev.onlyPending
    }));
  };

  const toggleDueSoonFilter = () => {
    setFilters((prev) => ({
      ...prev,
      dueSoon: !prev.dueSoon
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priorities: [],
      onlyPending: false,
      dueSoon: false
    });
    setSearchTerm("");
  };

  const hasActiveFilters = 
    searchTerm.trim().length > 0 || 
    filters.categories.length > 0 || 
    filters.priorities.length > 0 || 
    filters.onlyPending || 
    filters.dueSoon;

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
      <div className="bg-card rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-8 pr-3 py-2 rounded-md bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="sm"
            onClick={toggleFilter}
            className={cn(
              "gap-1.5", 
              filters.categories.length > 0 || 
              filters.priorities.length > 0 ||
              filters.onlyPending ||
              filters.dueSoon ? "border-primary/50" : ""
            )}
          >
            <Filter size={16} />
            <span className="hidden xs:inline">Filtros</span>
            {(filters.categories.length > 0 || 
              filters.priorities.length > 0 ||
              filters.onlyPending ||
              filters.dueSoon) && (
              <span className="bg-primary/20 rounded-full px-1.5 text-xs font-medium ml-0.5">
                {filters.categories.length + 
                 filters.priorities.length + 
                 (filters.onlyPending ? 1 : 0) +
                 (filters.dueSoon ? 1 : 0)
                }
              </span>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground"
            >
              <X size={14} />
              <span className="hidden xs:inline">Limpar</span>
            </Button>
          )}
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t"
            >
              <div className="space-y-3">
                {/* Categorias */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Tag size={14} className="mr-1.5" /> Categorias
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(TaskCategory).map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleCategoryFilter(category)}
                        className={cn(
                          "flex items-center px-2 py-1 rounded-full text-xs transition-all duration-200",
                          filters.categories.includes(category)
                            ? "bg-primary/20 border-primary border"
                            : "bg-muted border border-transparent hover:border-muted-foreground/30"
                        )}
                      >
                        <span className="mr-1">{categoryLabels[category].icon}</span>
                        {categoryLabels[category].label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Prioridades */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Prioridade</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(TaskPriority).map((priority) => (
                      <button
                        key={priority}
                        onClick={() => togglePriorityFilter(priority)}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs transition-all duration-200",
                          filters.priorities.includes(priority)
                            ? `${priorityLabels[priority].color} border-current border`
                            : "bg-muted border border-transparent hover:border-muted-foreground/30"
                        )}
                      >
                        {priorityLabels[priority].label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Outros filtros */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Outros filtros</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={togglePendingFilter}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs transition-all duration-200",
                        filters.onlyPending
                          ? "bg-primary/20 border-primary border"
                          : "bg-muted border border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      Apenas pendentes
                    </button>
                    <button
                      onClick={toggleDueSoonFilter}
                      className={cn(
                        "flex items-center px-2 py-1 rounded-full text-xs transition-all duration-200",
                        filters.dueSoon
                          ? "bg-primary/20 border-primary border"
                          : "bg-muted border border-transparent hover:border-muted-foreground/30"
                      )}
                    >
                      <Calendar size={12} className="mr-1" />
                      Vencendo em breve
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 