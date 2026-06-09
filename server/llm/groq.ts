import axios from "axios";
import { ILLMProvider, LLMConfig, LLMMessage, LLMResponse } from "./providers";

/**
 * Groq LLM Provider
 * Fast inference with Groq's LPU technology
 */
export class GroqProvider implements ILLMProvider {
  name: "groq" = "groq";
  private baseUrl = "https://api.groq.com/openai/v1";

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Groq API key not configured");

    const model = config.model || "mixtral-8x7b-32768";

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model,
        provider: "groq",
        tokensUsed: response.data.usage?.total_tokens,
      };
    } catch (error: any) {
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  async classify(text: string, categories: string[]): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `Classify the following text into one of these categories: ${categories.join(", ")}. Respond with ONLY the category name.`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      provider: "groq",
      model: "mixtral-8x7b-32768",
      temperature: 0.3,
      maxTokens: 50,
    });

    return response.content.trim();
  }

  async extractTags(text: string, maxTags = 5): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `Extract up to ${maxTags} relevant tags. Return ONLY comma-separated tags.`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      provider: "groq",
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      maxTokens: 100,
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
        content:
          "Suggest relationships between nodes. Return JSON array with {node, relationship} objects.",
      },
      {
        role: "user",
        content: `Main node: "${nodeBody}"\n\nOther nodes:\n- ${nodesList}\n\nSuggest relationships as JSON.`,
      },
    ];

    try {
      const response = await this.chat(messages, {
        provider: "groq",
        model: "mixtral-8x7b-32768",
        temperature: 0.5,
        maxTokens: 500,
      });

      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }
}
