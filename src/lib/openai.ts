"use server";

import OpenAI from "openai";

// Inicializar o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Divide uma tarefa em subtarefas usando a API da OpenAI
 */
export async function generateSubtasks(taskTitle: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em produtividade e organização. 
          Sua tarefa é dividir tarefas complexas em subtarefas menores, mais gerenciáveis e específicas.
          Responda APENAS com uma lista de subtarefas (entre 3 e 5), sem explicações ou texto adicional.
          Cada subtarefa deve ser clara, executável e ajudar na conclusão da tarefa principal.
          Você jamais deve pedir mais informações, apenas interpretar a tarefa da melhor forma possível.`
        },
        {
          role: "user",
          content: `Divida a seguinte tarefa em subtarefas menores: "${taskTitle}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    // Processar a resposta para extrair as subtarefas
    const subtasks = content
      .split(/\n/)
      .map(line => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(line => line.length > 0);

    return subtasks;
  } catch (error) {
    console.error("Erro ao gerar subtarefas:", error);
    return ["Erro ao gerar subtarefas. Tente novamente."];
  }
}

/**
 * Gera uma mensagem motivacional com base no progresso do usuário
 */
export async function generateMotivationalMessage(
  points: number, 
  level: number, 
  streak: number, 
  tasksCompleted: number
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente motivacional positivo e encorajador.
          Sua tarefa é gerar uma mensagem curta, motivacional e personalizada para um usuário
          baseada no progresso dele em um aplicativo de produtividade gamificado.
          A mensagem deve ser breve (máximo 2 frases), positiva, e mencionar especificamente os dados fornecidos.
          Use um tom amigável, casual e entusiasmado.`
        },
        {
          role: "user",
          content: `Gere uma mensagem motivacional baseada nesses dados:
          - Pontos: ${points}
          - Nível: ${level}
          - Sequência de dias: ${streak}
          - Tarefas concluídas hoje: ${tasksCompleted}`
        }
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const message = response.choices[0]?.message?.content?.trim() || 
      "Continue assim! Seu progresso é incrível.";

    return message;
  } catch (error) {
    console.error("Erro ao gerar mensagem motivacional:", error);
    return "Continue assim! Seu progresso é incrível.";
  }
}

/**
 * Estima o tempo necessário para completar uma tarefa usando IA
 */
export async function estimateTaskTime(
  taskTitle: string,
  category?: string
): Promise<{ estimatedTimeMinutes: number; confidence: 'low' | 'medium' | 'high' }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em gestão de tempo e produtividade.
          Sua tarefa é estimar o tempo necessário para completar uma tarefa específica.
          Considere o contexto, a complexidade aparente e o escopo da tarefa.
          Forneça uma estimativa realista em minutos. Não explique seu raciocínio.
          Forneça também um nível de confiança para sua estimativa (low, medium, high).
          Responda apenas com um JSON no formato: {"estimatedTimeMinutes": X, "confidence": "low|medium|high"}`
        },
        {
          role: "user",
          content: `Estime o tempo para completar esta tarefa${category ? ` na categoria ${category}` : ''}: "${taskTitle}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    try {
      const result = JSON.parse(content);
      // Validação básica da resposta
      if (typeof result.estimatedTimeMinutes !== 'number' || 
          !['low', 'medium', 'high'].includes(result.confidence)) {
        throw new Error("Formato de resposta inválido");
      }
      
      // Limitar a valores razoáveis (entre 1 minuto e 24 horas)
      const estimatedTime = Math.min(Math.max(result.estimatedTimeMinutes, 1), 24 * 60);
      
      return {
        estimatedTimeMinutes: Math.round(estimatedTime),
        confidence: result.confidence as 'low' | 'medium' | 'high'
      };
    } catch (parseError) {
      console.error("Erro ao analisar resposta de estimativa:", parseError);
      // Fallback para um valor padrão
      return { estimatedTimeMinutes: 30, confidence: 'low' };
    }
  } catch (error) {
    console.error("Erro ao estimar tempo da tarefa:", error);
    return { estimatedTimeMinutes: 30, confidence: 'low' };
  }
}

/**
 * Prioriza uma tarefa com base no seu contexto e conteúdo
 */
export async function suggestTaskPriority(
  taskTitle: string,
  existingTasks: string[] = [],
  dueDate?: string
): Promise<'low' | 'medium' | 'high'> {
  try {
    // Construir o contexto
    let context = `Tarefa: "${taskTitle}"`;
    if (dueDate) {
      context += `\nData de vencimento: ${dueDate}`;
    }
    if (existingTasks.length > 0) {
      context += `\nOutras tarefas existentes:\n${existingTasks.map(t => `- ${t}`).join('\n')}`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em produtividade e priorização de tarefas.
          Sua tarefa é sugerir uma prioridade para uma tarefa específica.
          Considere a urgência, importância, complexidade aparente e prazos (se informados).
          Considere também outras tarefas existentes, se fornecidas.
          Responda APENAS com uma das palavras: "low", "medium" ou "high", sem explicações adicionais.`
        },
        {
          role: "user",
          content: context
        }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const content = response.choices[0]?.message?.content?.trim().toLowerCase() || "";
    
    // Validar e retornar a prioridade
    if (content.includes('high')) return 'high';
    if (content.includes('medium')) return 'medium';
    if (content.includes('low')) return 'low';
    
    // Valor padrão se a resposta não for reconhecida
    return 'medium';
  } catch (error) {
    console.error("Erro ao sugerir prioridade:", error);
    return 'medium';
  }
} 