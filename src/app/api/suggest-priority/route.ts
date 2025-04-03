import { suggestTaskPriority } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { taskTitle, existingTasks, dueDate } = await req.json();

    if (!taskTitle || typeof taskTitle !== "string") {
      return NextResponse.json(
        { error: "Título da tarefa é obrigatório" },
        { status: 400 }
      );
    }

    const priority = await suggestTaskPriority(
      taskTitle, 
      existingTasks, 
      dueDate
    );
    
    return NextResponse.json({ priority });
  } catch (error) {
    console.error("Erro na API de sugestão de prioridade:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 