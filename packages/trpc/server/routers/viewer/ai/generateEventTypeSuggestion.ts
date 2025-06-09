import { z } from "zod";

import { getClaudeAIService } from "@calcom/lib/claudeAIService";

import authedProcedure from "../../../procedures/authedProcedure";

export const ZGenerateEventTypeSuggestionInputSchema = z.object({
  description: z.string().min(1).max(1000),
});

export type TGenerateEventTypeSuggestionInputSchema = z.infer<typeof ZGenerateEventTypeSuggestionInputSchema>;

export const generateEventTypeSuggestionProcedure = authedProcedure
  .input(ZGenerateEventTypeSuggestionInputSchema)
  .mutation(async ({ input }) => {
    const { description } = input;

    const apiKey = process.env.CLAUDE_API_KEY || "";
    if (!apiKey) {
      throw new Error("Claude API key not configured");
    }

    const claudeAIService = getClaudeAIService();
    const suggestion = await claudeAIService.generateEventTypeSuggestion(description);

    return suggestion;
  });
