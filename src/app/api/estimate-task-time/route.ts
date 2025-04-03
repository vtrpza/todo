import { estimateTaskTime } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { taskTitle, category } = await req.json();

    if (!taskTitle || typeof taskTitle !== "string") {
      return NextResponse.json(
        { error: "Título da tarefa é obrigatório" },
        { status: 400 }
      );
    }

    const estimation = await estimateTaskTime(taskTitle, category);
    
    return NextResponse.json(estimation);
  } catch (error) {
    console.error("Erro na API de estimativa de tempo:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 