import { z } from "zod";

import { getClaudeAIService } from "@calcom/lib/claudeAIService";

import authedProcedure from "../../../procedures/authedProcedure";

export const ZClassifyOOOReasonInputSchema = z.object({
  notes: z.string().min(1).max(1000),
});

export type TClassifyOOOReasonInputSchema = z.infer<typeof ZClassifyOOOReasonInputSchema>;

export const classifyOOOReasonProcedure = authedProcedure
  .input(ZClassifyOOOReasonInputSchema)
  .mutation(async ({ input }) => {
    const { notes } = input;

    const apiKey = process.env.CLAUDE_API_KEY || "";
    if (!apiKey) {
      throw new Error("Claude API key not configured");
    }

    const claudeAIService = getClaudeAIService();
    const classification = await claudeAIService.classifyOOOReason(notes);

    return { reason: classification };
  });
