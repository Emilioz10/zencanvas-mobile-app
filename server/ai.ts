import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { suggestedRelationships } from "../drizzle/schema";

/**
 * Generate relationship suggestions by analyzing node content and existing connections
 */
export async function generateRelationshipSuggestions(userId: number, nodeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // For now, return empty array as a placeholder
    // In production, this would query the database and call LLM
    // TODO: Implement full LLM-backed suggestion generation
    return [];

    // Placeholder for full implementation
  } catch (error) {
    console.error("Error generating relationship suggestions:", error);
    return [];
  }
}

/**
 * Decompose a complex task into actionable subtasks using AI
 */
export async function decomposeTask(userId: number, taskDescription: string) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert project manager at breaking down complex tasks into concrete, actionable subtasks.
Analyze the task and break it down into 3-7 specific, measurable subtasks.
Return a JSON array with objects containing: { title: string, description: string, effort: "small" | "medium" | "large", dependencies: string[] }`,
        },
        {
          role: "user",
          content: `Please break down this task: "${taskDescription}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "subtasks",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                effort: { enum: ["small", "medium", "large"] },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["title", "description", "effort", "dependencies"],
            },
          },
        },
      },
    });

    // Parse response
    let subtasks: Array<{ title: string; description: string; effort: string; dependencies: string[] }> = [];
    try {
      const content = response.choices[0]?.message.content;
      if (typeof content === "string") {
        subtasks = JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to parse LLM response:", e);
      return [];
    }

    return subtasks;
  } catch (error) {
    console.error("Error decomposing task:", error);
    return [];
  }
}
