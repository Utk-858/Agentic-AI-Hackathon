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
  specialRequest: z.string().optional().describe('Any special requests or other important considerations.'),
});
export type GenerateWorksheetInput = z.infer<typeof GenerateWorksheetInputSchema>;

const GenerateWorksheetOutputSchema = z.object({
  worksheet: z.string().describe('The generated worksheet, containing ONLY the questions, formatted in HTML.'),
  answerKey: z.string().describe('A separate answer key for the worksheet questions, formatted in HTML.'),
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
  async ({ topic, gradeLevel, numberOfQuestions, language, specialRequest }) => {
    
    const prompt = ai.definePrompt({
        name: 'generateWorksheetPrompt',
        output: { schema: GenerateWorksheetOutputSchema },
        prompt: `You are an AI assistant for teachers. Your task is to generate a worksheet and a separate answer key in ${language}.

        Topic: ${topic}
        Grade Level: ${gradeLevel}
        Number of Questions: ${numberOfQuestions}
      
        ${specialRequest ? `\nSpecial Request: "${specialRequest}"\nPlease adhere to this request when generating questions.` : ''}
      
        Instructions:
        1.  Create a "worksheet" with the specified number of questions suitable for the given grade level. Format it using simple HTML tags (<h2>, <p>, <ol>, <li>).
        2.  Create a separate "answerKey" that contains the answers to the questions. This section should also be formatted in clean HTML and start with an <h2> heading titled "Answer Key".
        3.  Ensure your response is a valid JSON object containing both the "worksheet" and "answerKey" fields. Do not include <!DOCTYPE> or <html>/<body> tags in your HTML content.`,
    });


    const {output} = await prompt({});
    
    if (!output) {
        return {
            worksheet: "Sorry, I couldn't generate a worksheet. Please try again.",
            answerKey: "No answer key could be generated."
        };
    }

    return output;
  }
);
