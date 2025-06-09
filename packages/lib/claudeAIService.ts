import Anthropic from "@anthropic-ai/sdk";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["claudeAIService"] });

interface AICommand<TResult> {
  execute(): Promise<TResult>;
}

class GenerateEventTypeSuggestionCommand implements AICommand<{ title: string; slug: string }> {
  private description: string;
  private client: Anthropic;

  constructor(description: string, apiKey: string) {
    this.description = description;
    this.client = new Anthropic({ apiKey });
  }

  async execute(): Promise<{ title: string; slug: string }> {
    try {
      const prompt = `Based on this event description: "${this.description}"
      
Generate:
1. A professional, concise event title (maximum 50 characters)
2. A URL-friendly slug (lowercase, hyphens for spaces, no special characters)

Format your response as JSON:
{
  "title": "Your Title Here",
  "slug": "your-slug-here"
}

Examples:
- Description: "Weekly one-on-one meetings with team members to discuss progress and concerns"
  Title: "Weekly 1:1 Check-in"
  Slug: "weekly-1-1-checkin"
  
- Description: "Initial consultation for new clients interested in our services"
  Title: "New Client Consultation"
  Slug: "new-client-consultation"`;

      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response format from Claude");
      }

      const response = JSON.parse(content.text);
      
      // Ensure constraints are met
      const title = response.title.substring(0, 50);
      const slug = response.slug.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      return { title, slug };
    } catch (error) {
      log.error("Failed to generate event type suggestion", error);
      throw new Error("Failed to generate event type suggestion");
    }
  }
}

class ClassifyOOOReasonCommand implements AICommand<string> {
  private notes: string;
  private client: Anthropic;

  constructor(notes: string, apiKey: string) {
    this.notes = notes;
    this.client = new Anthropic({ apiKey });
  }

  async execute(): Promise<string> {
    try {
      const prompt = `Based on these out-of-office notes: "${this.notes}"
      
Select the most appropriate reason from the following categories:
- vacation: Taking time off for leisure, holidays, personal trips
- sick-leave: Medical appointments, illness, health-related absences
- travel: Business trips, conferences, work-related travel
- personal: Personal matters, family events, emergencies
- other: Anything that doesn't fit the above categories

Respond with just the category name (e.g., "vacation").

Examples:
- "Going to Hawaii for a week" → vacation
- "Doctor's appointment and recovery" → sick-leave
- "Attending the sales conference in NYC" → travel
- "Family emergency, need to be with relatives" → personal
- "Working on a special project offsite" → other`;

      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 50,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response format from Claude");
      }

      const reason = content.text.trim().toLowerCase();
      const validReasons = ["vacation", "sick-leave", "travel", "personal", "other"];
      
      if (!validReasons.includes(reason)) {
        log.warn(`Invalid reason returned by AI: ${reason}, defaulting to 'other'`);
        return "other";
      }

      return reason;
    } catch (error) {
      log.error("Failed to classify OOO reason", error);
      throw new Error("Failed to classify OOO reason");
    }
  }
}

export class ClaudeAIService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  async generateEventTypeSuggestion(description: string): Promise<{ title: string; slug: string }> {
    const command = new GenerateEventTypeSuggestionCommand(description, this.apiKey);
    return command.execute();
  }

  async classifyOOOReason(notes: string): Promise<string> {
    const command = new ClassifyOOOReasonCommand(notes, this.apiKey);
    return command.execute();
  }
}

// Singleton instance
let instance: ClaudeAIService | null = null;

export function getClaudeAIService(): ClaudeAIService {
  if (!instance) {
    instance = new ClaudeAIService();
  }
  return instance;
}