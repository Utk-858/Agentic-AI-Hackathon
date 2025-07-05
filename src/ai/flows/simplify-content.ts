// This file uses server-side code.
'use server';

/**
 * @fileOverview AI flow for simplifying complex text into simpler terms.
 *
 * - simplifyContent - A function that simplifies complex text.
 * - SimplifyContentInput - The input type for the simplifyContent function.
 * - SimplifyContentOutput - The return type for the simplifyContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimplifyContentInputSchema = z.object({
  complexText: z.string().describe('The complex text that needs to be simplified.'),
  targetAudience: z
    .string()
    .optional()
    .describe('The target audience for the simplified text (e.g., elementary school students).'),
  language: z.string().describe('The language to simplify the content into.'),
});
export type SimplifyContentInput = z.infer<typeof SimplifyContentInputSchema>;

const SimplifyContentOutputSchema = z.object({
  simplifiedText: z.string().describe('The simplified version of the input text.'),
});
export type SimplifyContentOutput = z.infer<typeof SimplifyContentOutputSchema>;

export async function simplifyContent(input: SimplifyContentInput): Promise<SimplifyContentOutput> {
  return simplifyContentFlow(input);
}

const simplifyContentFlow = ai.defineFlow(
  {
    name: 'simplifyContentFlow',
    inputSchema: SimplifyContentInputSchema,
    outputSchema: SimplifyContentOutputSchema,
  },
  async ({ complexText, targetAudience, language }) => {
    const prompt = `You are an expert at simplifying complex text for different audiences in various languages.

Simplify the following text into ${language}.
The target audience is: ${targetAudience}.

Complex Text:
"""
${complexText}
"""

Provide only the simplified text as a direct response, without any extra commentary. Format the output using markdown.`;
    
    const result = await ai.generate({
      prompt: prompt,
    });

    const simplifiedText = result.text ?? "Sorry, I couldn't simplify the text. Please try again.";

    return { simplifiedText };
  }
);
