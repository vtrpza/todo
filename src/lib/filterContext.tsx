"use client";

import { createContext, useContext, ReactNode } from "react";
import { TaskCategory, TaskPriority } from "@/lib/types";

// Tipo para os filtros
export type TaskFilters = {
  categories: TaskCategory[];
  priorities: TaskPriority[];
  onlyPending: boolean;
  dueSoon: boolean;
};

// Contexto para busca e filtros
export type FilterContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters | ((prev: TaskFilters) => TaskFilters)) => void;
};

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};

// Provider component
interface FilterProviderProps {
  children: ReactNode;
  value: FilterContextType;
}

export const FilterProvider = ({ children, value }: FilterProviderProps) => {
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}; 