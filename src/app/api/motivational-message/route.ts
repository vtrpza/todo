import { generateMotivationalMessage } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { points, level, streak, tasksCompleted } = await req.json();

    if (
      typeof points !== "number" ||
      typeof level !== "number" ||
      typeof streak !== "number" ||
      typeof tasksCompleted !== "number"
    ) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    const message = await generateMotivationalMessage(
      points,
      level,
      streak,
      tasksCompleted
    );
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error("Erro na API de mensagem motivacional:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 