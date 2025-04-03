"use client";

import { AddTask } from "@/components/AddTask";
import { GamificationPanel } from "@/components/GamificationPanel";
import { TaskList } from "@/components/TaskList";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text mb-2">
            TaskHero
          </h1>
          <p className="text-muted-foreground">
            Complete tarefas, ganhe pontos, suba de nível!
          </p>
        </motion.div>

        <GamificationPanel />
        <AddTask />
        <TaskList />
      </div>
    </main>
  );
}
