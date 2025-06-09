import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export interface EventTypeAIResponse {
  title: string;
  slug: string;
}

export interface OOOReasonAIResponse {
  reasonId: number;
  confidence: number;
}

export async function generateEventTypeFromDescription(description: string): Promise<EventTypeAIResponse> {
  try {
    const prompt = `Based on the following event description, generate a concise, professional title and URL slug for a calendar event type.

Description: "${description}"

Requirements:
- Title should be 2-6 words, professional and clear
- Slug should be lowercase, hyphenated, URL-friendly
- Focus on the main purpose/outcome of the meeting
- Avoid generic terms like "meeting" or "call" unless necessary

Respond in JSON format:
{
  "title": "Professional Event Title",
  "slug": "professional-event-title"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return {
        title: parsed.title,
        slug: parsed.slug,
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error generating event type:', error);
    throw new Error('Failed to generate event type suggestions');
  }
}

export async function selectOOOReasonFromNotes(notes: string): Promise<OOOReasonAIResponse> {
  try {
    const prompt = `Analyze the following out-of-office notes and select the most appropriate reason category.

Notes: "${notes}"

Available reasons:
1. Vacation (personal time off, holidays, leisure travel)
2. Travel (business travel, work-related trips)
3. Sick Leave (illness, medical appointments, health issues)
4. Public Holiday (national holidays, company holidays)
5. Unspecified (general absence, personal matters, other)

Consider the context and keywords to determine the best match. Provide a confidence score (0-100).

Respond in JSON format:
{
  "reasonId": 1,
  "confidence": 85
}

Reason ID mapping:
- 1: Vacation
- 2: Travel  
- 3: Sick Leave
- 4: Public Holiday
- 5: Unspecified`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return {
        reasonId: parsed.reasonId,
        confidence: parsed.confidence,
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error selecting OOO reason:', error);
    throw new Error('Failed to analyze OOO notes');
  }
}
