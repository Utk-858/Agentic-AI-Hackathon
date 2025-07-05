'use server';
/**
 * @fileOverview A multimodal AI tutor that can understand text and images.
 *
 * - multimodalTutor - A function that provides tutoring based on text and an optional image.
 * - MultimodalTutorInput - The input type for the multimodalTutor function.
 * - MultimodalTutorOutput - The return type for the multimodalTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultimodalTutorInputSchema = z.object({
  query: z.string().describe("The student's question or prompt."),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional image provided by the student, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type MultimodalTutorInput = z.infer<typeof MultimodalTutorInputSchema>;

const MultimodalTutorOutputSchema = z.object({
  response: z.string().describe("The AI tutor's response to the student."),
});
export type MultimodalTutorOutput = z.infer<typeof MultimodalTutorOutputSchema>;

export async function multimodalTutor(input: MultimodalTutorInput): Promise<MultimodalTutorOutput> {
  return multimodalTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'multimodalTutorPrompt',
  input: {schema: MultimodalTutorInputSchema},
  output: {schema: MultimodalTutorOutputSchema},
  prompt: `You are a friendly and helpful AI tutor called VidyaSutra. Your goal is to help students understand concepts on any topic. Be encouraging and break down complex ideas into simple, easy-to-understand explanations. You are capable of conversing in multiple languages, including native Indian languages like Hindi, Marathi, Bengali, Tamil, etc. If the user speaks in another language, respond in that language.

The student has the following query:
"{{{query}}}"

{{#if imageDataUri}}
They have also provided an image for context.
Image: {{media url=imageDataUri}}
{{/if}}

Please provide a clear, concise, and helpful response to the student's query. Format your response using markdown.`,
});

const multimodalTutorFlow = ai.defineFlow(
  {
    name: 'multimodalTutorFlow',
    inputSchema: MultimodalTutorInputSchema,
    outputSchema: MultimodalTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
