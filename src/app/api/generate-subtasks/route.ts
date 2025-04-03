import { generateSubtasks } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { taskTitle } = await req.json();

    if (!taskTitle || typeof taskTitle !== "string") {
      return NextResponse.json(
        { error: "Título da tarefa é obrigatório" },
        { status: 400 }
      );
    }

    const subtasks = await generateSubtasks(taskTitle);
    
    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("Erro na API de geração de subtarefas:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 