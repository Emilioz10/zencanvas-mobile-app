import axios from "axios";
import { ILLMProvider, LLMConfig, LLMMessage, LLMResponse } from "./providers";

/**
 * OpenRouter LLM Provider
 * Supports hundreds of models via OpenRouter API
 */
export class OpenRouterProvider implements ILLMProvider {
  name: "openrouter" = "openrouter";
  private baseUrl = "https://openrouter.ai/api/v1";

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      return !!apiKey;
    } catch {
      return false;
    }
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OpenRouter API key not configured");

    const model = config.model || "meta-llama/llama-2-7b-chat";

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
            "HTTP-Referer": "https://zencanvas.app",
            "X-Title": "ZenCanvas",
          },
        }
      );

      return {
        content: response.data.choices[0].message.content,
        model,
        provider: "openrouter",
        tokensUsed: response.data.usage?.total_tokens,
      };
    } catch (error: any) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
  }

  async classify(text: string, categories: string[]): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `You are a content classifier. Classify the following text into one of these categories: ${categories.join(", ")}. Respond with ONLY the category name, nothing else.`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      provider: "openrouter",
      model: "meta-llama/llama-2-7b-chat",
      temperature: 0.3,
      maxTokens: 50,
    });

    return response.content.trim();
  }

  async extractTags(text: string, maxTags = 5): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `Extract up to ${maxTags} relevant tags from the following text. Return ONLY comma-separated tags, no explanations.`,
      },
      { role: "user", content: text },
    ];

    const response = await this.chat(messages, {
      provider: "openrouter",
      model: "meta-llama/llama-2-7b-chat",
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
          "You are a knowledge graph expert. Given a node and a list of other nodes, suggest relationships. Return JSON array with {node, relationship} objects.",
      },
      {
        role: "user",
        content: `Main node: "${nodeBody}"\n\nOther nodes:\n- ${nodesList}\n\nSuggest relationships as JSON array.`,
      },
    ];

    try {
      const response = await this.chat(messages, {
        provider: "openrouter",
        model: "meta-llama/llama-2-7b-chat",
        temperature: 0.5,
        maxTokens: 500,
      });

      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }
}
