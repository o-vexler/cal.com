import { z } from "zod";

import { getClaudeAIService } from "@calcom/lib/claudeAIService";
import { protectedProcedure } from "@calcom/trpc/server/procedures/authedProcedure";
import { router } from "@calcom/trpc/server/trpc";

const classifyOOOReasonSchema = z.object({
  notes: z.string().min(1),
});

export const classifyOOOReasonHandler = protectedProcedure
  .input(classifyOOOReasonSchema)
  .mutation(async ({ input }) => {
    const { notes } = input;
    
    try {
      const aiService = getClaudeAIService();
      const reason = await aiService.classifyOOOReason(notes);
      return { reason };
    } catch (error) {
      throw new Error("Failed to classify OOO reason");
    }
  });

export default classifyOOOReasonHandler;