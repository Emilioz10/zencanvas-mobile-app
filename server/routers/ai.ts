import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { LocalProvider } from "../llm/local";
import { OpenRouterProvider } from "../llm/openrouter";
import { GroqProvider } from "../llm/groq";
import { OllamaProvider } from "../llm/ollama";

/**
 * AI Accessibility Procedures
 * Helps users with cognitive disabilities structure and express their thoughts
 */

const localProvider = new LocalProvider();
const openRouterProvider = new OpenRouterProvider();
const groqProvider = new GroqProvider();
const ollamaProvider = new OllamaProvider();

// Try providers in fallback order (prefer cloud if available, fallback to local)
async function getAvailableProvider() {
  if (await groqProvider.isAvailable()) return groqProvider;
  if (await openRouterProvider.isAvailable()) return openRouterProvider;
  if (await ollamaProvider.isAvailable()) return ollamaProvider;
  return localProvider; // Always fallback to local (works offline)
}

export const aiRouter = router({
  /**
   * Expression Assistant
   * Helps clarify vague or unclear thoughts
   */
  expressionAssistant: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const provider = await getAvailableProvider();

      try {
        const response = await provider.chat(
          [
            {
              role: "system",
              content:
                "You are an accessibility assistant. Help the user clarify and improve how they express their thoughts. Suggest clearer wording and ask clarifying questions if needed. Be empathetic and supportive.",
            },
            {
              role: "user",
              content: `Help me clarify this thought: "${input.text}"`,
            },
          ],
          { provider: provider.name }
        );

        return {
          success: true,
          suggestion: response.content,
          provider: response.provider,
        };
      } catch (error) {
        return {
          success: false,
          error: "Could not process expression. Try again or use a simpler thought.",
        };
      }
    }),

  /**
   * Purpose Clarifier
   * Identifies the purpose of content (task, reference, memory, etc)
   */
  purposeClarifier: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const provider = await getAvailableProvider();

      try {
        const response = await provider.classify(input.text, [
          "task",
          "note",
          "idea",
          "reference",
          "memory",
          "goal",
          "question",
          "decision",
        ]);

        return {
          success: true,
          purpose: response,
          provider: provider.name,
        };
      } catch (error) {
        return {
          success: false,
          error: "Could not identify purpose. Please select manually.",
        };
      }
    }),

  /**
   * Auto-Classifier
   * Suggests type, tags, and status for content
   */
  autoClassifier: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const provider = await getAvailableProvider();

      try {
        const tags = await provider.extractTags(input.text, 5);
        const type = await provider.classify(input.text, [
          "task",
          "note",
          "project",
          "person",
          "event",
          "idea",
        ]);

        return {
          success: true,
          classification: {
            type,
            tags,
            suggestedStatus: type === "task" ? "inbox" : "active",
          },
          provider: provider.name,
        };
      } catch (error) {
        return {
          success: false,
          error: "Could not classify content. Please classify manually.",
        };
      }
    }),

  /**
   * Content Structurer
   * Organizes complex content into clear sections
   */
  contentStructurer: publicProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const provider = await getAvailableProvider();

      try {
        const response = await provider.chat(
          [
            {
              role: "system",
              content:
                "You are an accessibility assistant. Help organize content into clear, structured sections. Use simple language and clear headings. Format as markdown with sections.",
            },
            {
              role: "user",
              content: `Organize this content into clear sections:\n\n${input.text}`,
            },
          ],
          { provider: provider.name }
        );

        return {
          success: true,
          structured: response.content,
          provider: response.provider,
        };
      } catch (error) {
        return {
          success: false,
          error: "Could not structure content. Try breaking it into smaller parts.",
        };
      }
    }),

  /**
   * Relationship Suggester
   * Finds connections between nodes
   */
  relationshipSuggester: publicProcedure
    .input(
      z.object({
        nodeBody: z.string(),
        otherNodes: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const provider = await getAvailableProvider();

      try {
        const relationships = await provider.suggestRelationships(
          input.nodeBody,
          input.otherNodes
        );

        return {
          success: true,
          relationships,
          provider: provider.name,
        };
      } catch (error) {
        return {
          success: false,
          relationships: [],
          error: "Could not suggest relationships.",
        };
      }
    }),

  /**
   * Get available LLM providers
   */
  getAvailableProviders: publicProcedure.query(async () => {
    const providers = [];

    if (await localProvider.isAvailable()) providers.push("local");
    if (await groqProvider.isAvailable()) providers.push("groq");
    if (await openRouterProvider.isAvailable()) providers.push("openrouter");
    if (await ollamaProvider.isAvailable()) providers.push("ollama");

    return {
      available: providers,
      primary: providers[0] || "local",
    };
  }),
});
