/**
 * Knowledge router — AI-assisted Hebrew text rewriting
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const knowledgeRouter = router({
  /**
   * Rewrite / transform Hebrew text using built-in LLM
   */
  aiRewrite: protectedProcedure
    .input(z.object({
      body: z.string().min(1).max(20000),
      instruction: z.string().min(1).max(500),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `אתה עוזר כתיבה בעברית. תפקידך לעזור לעבד, לשכתב ולארגן טקסטים בעברית.
הנחיות:
- כתוב תמיד בעברית תקינה ובהירה
- שמור על המשמעות המקורית אלא אם הנחיה מפורשת אחרת
- השתמש בפורמט Markdown כשמתאים
- אל תוסיף הסברים מיותרים — רק את הטקסט המבוקש`,
          },
          {
            role: "user",
            content: `הנחיה: ${input.instruction}\n\nטקסט:\n${input.body}`,
          },
        ],
      });

      const text = response?.choices?.[0]?.message?.content ?? "";
      return { text };
    }),
});
