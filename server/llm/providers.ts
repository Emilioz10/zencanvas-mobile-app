/**
 * Unified LLM Provider Interface
 * Supports: OpenRouter, Groq, Ollama, Claude, On-Device (TensorFlow.js)
 */

export type LLMProvider = "openrouter" | "groq" | "ollama" | "claude" | "local";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  tokensUsed?: number;
  cached?: boolean;
}

export interface ILLMProvider {
  name: LLMProvider;
  isAvailable(): Promise<boolean>;
  chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
  classify(text: string, categories: string[]): Promise<string>;
  extractTags(text: string, maxTags?: number): Promise<string[]>;
  suggestRelationships(
    nodeBody: string,
    otherNodes: string[]
  ): Promise<Array<{ node: string; relationship: string }>>;
}

/**
 * Provider Registry
 */
export const PROVIDERS: Record<LLMProvider, ILLMProvider> = {} as any;

/**
 * Configuration storage
 */
export class LLMConfigManager {
  private configs: Map<LLMProvider, LLMConfig> = new Map();

  setConfig(provider: LLMProvider, config: LLMConfig) {
    this.configs.set(provider, config);
  }

  getConfig(provider: LLMProvider): LLMConfig | undefined {
    return this.configs.get(provider);
  }

  getAllConfigs(): LLMConfig[] {
    return Array.from(this.configs.values());
  }

  removeConfig(provider: LLMProvider) {
    this.configs.delete(provider);
  }
}

/**
 * LLM Service with fallback chain
 */
export class LLMService {
  private configManager: LLMConfigManager;
  private primaryProvider: LLMProvider;
  private fallbackChain: LLMProvider[] = [];

  constructor(configManager: LLMConfigManager, primaryProvider: LLMProvider = "local") {
    this.configManager = configManager;
    this.primaryProvider = primaryProvider;
  }

  setPrimaryProvider(provider: LLMProvider) {
    this.primaryProvider = provider;
  }

  setFallbackChain(providers: LLMProvider[]) {
    this.fallbackChain = providers;
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const chain = [this.primaryProvider, ...this.fallbackChain];

    for (const provider of chain) {
      const config = this.configManager.getConfig(provider);
      if (!config) continue;

      try {
        const providerImpl = PROVIDERS[provider];
        if (!providerImpl || !(await providerImpl.isAvailable())) continue;

        return await providerImpl.chat(messages, config);
      } catch (error) {
        console.warn(`[LLM] ${provider} failed:`, error);
        continue;
      }
    }

    throw new Error("No available LLM providers");
  }

  async classify(text: string, categories: string[]): Promise<string> {
    const chain = [this.primaryProvider, ...this.fallbackChain];

    for (const provider of chain) {
      try {
        const providerImpl = PROVIDERS[provider];
        if (!providerImpl || !(await providerImpl.isAvailable())) continue;

        return await providerImpl.classify(text, categories);
      } catch (error) {
        console.warn(`[LLM] ${provider} classification failed:`, error);
        continue;
      }
    }

    return categories[0]; // Fallback to first category
  }

  async extractTags(text: string, maxTags = 5): Promise<string[]> {
    const chain = [this.primaryProvider, ...this.fallbackChain];

    for (const provider of chain) {
      try {
        const providerImpl = PROVIDERS[provider];
        if (!providerImpl || !(await providerImpl.isAvailable())) continue;

        return await providerImpl.extractTags(text, maxTags);
      } catch (error) {
        console.warn(`[LLM] ${provider} tag extraction failed:`, error);
        continue;
      }
    }

    return [];
  }

  async suggestRelationships(
    nodeBody: string,
    otherNodes: string[]
  ): Promise<Array<{ node: string; relationship: string }>> {
    const chain = [this.primaryProvider, ...this.fallbackChain];

    for (const provider of chain) {
      try {
        const providerImpl = PROVIDERS[provider];
        if (!providerImpl || !(await providerImpl.isAvailable())) continue;

        return await providerImpl.suggestRelationships(nodeBody, otherNodes);
      } catch (error) {
        console.warn(`[LLM] ${provider} relationship suggestion failed:`, error);
        continue;
      }
    }

    return [];
  }
}
