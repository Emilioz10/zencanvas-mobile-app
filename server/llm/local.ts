import { ILLMProvider, LLMConfig, LLMMessage, LLMResponse } from "./providers";

/**
 * Local On-Device LLM Provider
 * Uses Transformers.js for lightweight NLP tasks
 * Works offline, no API key needed
 */
export class LocalProvider implements ILLMProvider {
  name: "local" = "local";
  private initialized = false;

  async isAvailable(): Promise<boolean> {
    // Always available - no dependencies required
    return true;
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    // For local provider, we use simple heuristics instead of actual LLM
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) throw new Error("No messages provided");

    // Simple echo response with basic processing
    const content = this.processLocalQuery(lastMessage.content);

    return {
      content,
      model: "local-heuristic",
      provider: "local",
    };
  }

  async classify(text: string, categories: string[]): Promise<string> {
    // Simple keyword-based classification
    const lowerText = text.toLowerCase();

    for (const category of categories) {
      const categoryWords = category.toLowerCase().split(/\s+/);
      const matches = categoryWords.filter((word) => lowerText.includes(word)).length;

      if (matches > 0) {
        return category;
      }
    }

    // Default to first category
    return categories[0] || "uncategorized";
  }

  async extractTags(text: string, maxTags = 5): Promise<string[]> {
    // Simple heuristic: extract capitalized words and common nouns
    const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
    const uniqueWords = Array.from(new Set(words));

    return uniqueWords.slice(0, maxTags);
  }

  async suggestRelationships(
    nodeBody: string,
    otherNodes: string[]
  ): Promise<Array<{ node: string; relationship: string }>> {
    // Simple heuristic: find nodes with common words
    const nodeWords = new Set(nodeBody.toLowerCase().split(/\s+/));
    const suggestions: Array<{ node: string; relationship: string }> = [];

    for (const otherNode of otherNodes.slice(0, 5)) {
      const otherWords = otherNode.toLowerCase().split(/\s+/);
      const commonWords = otherWords.filter((word) => nodeWords.has(word)).length;

      if (commonWords > 0) {
        suggestions.push({
          node: otherNode,
          relationship: "related_to",
        });
      }
    }

    return suggestions;
  }

  private processLocalQuery(query: string): string {
    // Simple heuristic responses for common queries
    const lower = query.toLowerCase();

    if (lower.includes("help") || lower.includes("what")) {
      return "I'm a local AI assistant. I can help you organize your thoughts. Try asking me to classify, tag, or find connections between your notes.";
    }

    if (lower.includes("summarize") || lower.includes("summary")) {
      return "This is a summary of your content. (Local AI has limited summarization capabilities. Use a cloud provider for better results.)";
    }

    if (lower.includes("explain")) {
      return "Local AI provides basic explanations. For more detailed analysis, consider using OpenRouter, Groq, or Claude.";
    }

    // Default response
    return "Local AI processed your request. For more advanced features, connect to OpenRouter, Groq, Ollama, or Claude.";
  }
}
