// src/ai/flows/worksheet-generation.ts
'use server';

/**
 * @fileOverview AI-powered worksheet generation for teachers. Generates questions and answers on a given topic.
 *
 * - generateWorksheet - A function that generates a worksheet with questions and answers on a given topic.
 * - GenerateWorksheetInput - The input type for the generateWorksheet function.
 * - GenerateWorksheetOutput - The return type for the generateWorksheet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorksheetInputSchema = z.object({
  topic: z.string().describe('The topic for the worksheet.'),
  gradeLevel: z.string().describe('The grade level for the worksheet.'),
  numberOfQuestions: z.number().describe('The number of questions to generate.'),
  language: z.string().describe('The language for the worksheet.'),
});
export type GenerateWorksheetInput = z.infer<typeof GenerateWorksheetInputSchema>;

const GenerateWorksheetOutputSchema = z.object({
  worksheet: z.string().describe('The generated worksheet with questions and answers.'),
});
export type GenerateWorksheetOutput = z.infer<typeof GenerateWorksheetOutputSchema>;

export async function generateWorksheet(input: GenerateWorksheetInput): Promise<GenerateWorksheetOutput> {
  return generateWorksheetFlow(input);
}

const generateWorksheetFlow = ai.defineFlow(
  {
    name: 'generateWorksheetFlow',
    inputSchema: GenerateWorksheetInputSchema,
    outputSchema: GenerateWorksheetOutputSchema,
  },
  async ({ topic, gradeLevel, numberOfQuestions, language }) => {
    const prompt = `You are an AI assistant for teachers. Your task is to generate a worksheet in ${language}.

Topic: ${topic}
Grade Level: ${gradeLevel}
Number of Questions: ${numberOfQuestions}

Generate a worksheet with the specified number of questions suitable for the given grade level. The worksheet should be formatted clearly in markdown and be easy to read. After all the questions, include a separate section titled "Answer Key" with the answers.`;

    const result = await ai.generate({
      prompt: prompt,
    });

    const worksheet = result.text ?? "Sorry, I couldn't generate a worksheet. Please try again.";

    return { worksheet };
  }
);
