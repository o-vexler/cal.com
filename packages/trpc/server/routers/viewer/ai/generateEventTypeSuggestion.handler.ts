import { z } from "zod";

import { getClaudeAIService } from "@calcom/lib/claudeAIService";
import { protectedProcedure } from "@calcom/trpc/server/procedures/authedProcedure";
import { router } from "@calcom/trpc/server/trpc";

const generateEventTypeSuggestionSchema = z.object({
  description: z.string().min(1),
});

export const generateEventTypeSuggestionHandler = protectedProcedure
  .input(generateEventTypeSuggestionSchema)
  .mutation(async ({ input }) => {
    const { description } = input;
    
    try {
      const aiService = getClaudeAIService();
      const suggestion = await aiService.generateEventTypeSuggestion(description);
      return suggestion;
    } catch (error) {
      throw new Error("Failed to generate event type suggestion");
    }
  });

export default generateEventTypeSuggestionHandler;