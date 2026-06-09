import axios from "axios";
import { ILLMProvider, LLMConfig, LLMMessage, LLMResponse } from "./providers";

/**
 * Ollama LLM Provider
 * Local LLM inference via Ollama
 */
export class OllamaProvider implements ILLMProvider {
  name: "ollama" = "ollama";
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const model = config.model || "llama2";

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
        },
        { timeout: 60000 }
      );

      return {
        content: response.data.message.content,
        model,
        provider: "ollama",
      };
    } catch (error: any) {
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async classify(text: string, categories: string[]): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `Classify the text into one of: ${categories.join(", ")}. Answer with ONLY the category.`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      provider: "ollama",
      model: "llama2",
      temperature: 0.3,
    });

    return response.content.trim();
  }

  async extractTags(text: string, maxTags = 5): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `Extract ${maxTags} tags from the text. Return ONLY comma-separated tags.`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      provider: "ollama",
      model: "llama2",
      temperature: 0.5,
    });

    return response.content
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, maxTags);
  }

  async suggestRelationships(
    nodeBody: string,
    otherNodes: string[]
  ): Promise<Array<{ node: string; relationship: string }>> {
    if (otherNodes.length === 0) return [];

    const nodesList = otherNodes.slice(0, 10).join("\n- ");
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: "Suggest relationships. Return JSON array with {node, relationship}.",
      },
      {
        role: "user",
        content: `Main: "${nodeBody}"\n\nOthers:\n- ${nodesList}\n\nJSON:`,
      },
    ];

    try {
      const response = await this.chat(messages, {
        provider: "ollama",
        model: "llama2",
        temperature: 0.5,
      });

      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }
}
