'use server';

/**
 * @fileOverview AI flow for simplifying complex text into simpler terms.
 *
 * - simplifyContent - A function that simplifies complex text.
 * - SimplifyContentInput - The input type for the simplifyContent function.
 * - SimplifyContentOutput - The return type for the simplifyContent function.
 */

import { ai } from '@/ai/genkit';
import { callOllamaGemma } from '@/ai/ollama';
import { z } from 'genkit';

const SimplifyContentInputSchema = z.object({
  complexText: z.string().describe('The complex text that needs to be simplified.'),
  targetAudience: z
    .string()
    .optional()
    .describe('The target audience for the simplified text (e.g., elementary school students).'),
  language: z.string().describe('The language to simplify the content into.'),
  specialRequest: z.string().optional().describe('Any special requests or other important considerations, e.g., "focus on the main idea" or "use a formal tone".'),
});
export type SimplifyContentInput = z.infer<typeof SimplifyContentInputSchema>;

const SimplifyContentOutputSchema = z.object({
  simplifiedText: z.string().describe('The simplified version of the input text.'),
});
export type SimplifyContentOutput = z.infer<typeof SimplifyContentOutputSchema>;

export async function simplifyContent(input: SimplifyContentInput, isOnline: boolean): Promise<SimplifyContentOutput> {
  if (isOnline) {
    return await simplifyContentFlow(input);
  } else {
    let prompt = `
You are an expert teacher. Your task is to explain the following concept or text in a way that is much easier to understand for the target audience:

- Target Audience: ${input.targetAudience}
- Language: ${input.language}

Original Text:
"""
${input.complexText}
"""

Instructions:
- Do NOT just summarize or shorten the text. Instead, explain the concept in a simple, clear, and engaging way.
- Use your own knowledge, analogies, and examples to help the student truly understand the concept.
- Use clear, age-appropriate language and break down complex ideas into smaller, digestible parts.
- If helpful, use bullet points (<ul>/<li>), short paragraphs (<p>), and bold key terms (<strong>).
- Do NOT include <!DOCTYPE> or <html>/<body> tags.
- Do NOT use Markdown.
- Use only the specified HTML tags for formatting.

${input.specialRequest ? `Special Request: ${input.specialRequest}` : ''}
`;
    const simplifiedText = await callOllamaGemma(prompt);
    return { simplifiedText };
  }
}

const simplifyContentFlow = ai.defineFlow(
  {
    name: 'simplifyContentFlow',
    inputSchema: SimplifyContentInputSchema,
    outputSchema: SimplifyContentOutputSchema,
  },
  async ({ complexText, targetAudience, language, specialRequest }) => {
    let prompt = `You are an expert at simplifying complex text for different audiences in various languages.\n\nSimplify the following text into ${language}.\nThe target audience is: ${targetAudience}.\n\nComplex Text:\n\"\"\"\n${complexText}\n\"\"\"`;
    if (specialRequest) {
      prompt += `\n\nSpecial Request: \"${specialRequest}\"\nPlease take this special request into account.`;
    }
    prompt += `\n\nProvide only the simplified text as a direct response, without any extra commentary. Format the output using simple HTML tags like <p>, <strong>, and <ul>/<li> for clarity. Do not include a <!DOCTYPE> or <html>/<body> tags.`;
    
    const result = await ai.generate({
      prompt: prompt,
    });

    const simplifiedText = result.text ?? "Sorry, I couldn't simplify the text. Please try again.";

    return { simplifiedText };
  }
);
