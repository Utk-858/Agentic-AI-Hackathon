// src/ai/flows/worksheet-generation.ts
'use server';

/**
 * @fileOverview AI-powered worksheet generation for teachers. Generates questions and answers on a given topic.
 *
 * - generateWorksheet - A function that generates a worksheet with questions and answers on a given topic.
 * - GenerateWorksheetInput - The input type for the generateWorksheet function.
 * - GenerateWorksheetOutput - The return type for the generateWorksheet function.
 */

import { ai } from '@/ai/genkit';
import { callOllamaGemma } from '@/ai/ollama';
import { z } from 'genkit';

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

export async function generateWorksheet(input: GenerateWorksheetInput, isOnline: boolean): Promise<GenerateWorksheetOutput> {
  if (isOnline) {
    return await generateWorksheetFlow(input);
  } else {
    let prompt = `
You are an expert teacher. Generate a worksheet for the following:

- Topic: ${input.topic}
- Grade Level: ${input.gradeLevel}
- Number of Questions: ${input.numberOfQuestions}
- Language: ${input.language}

Instructions:
1. Create exactly ${input.numberOfQuestions} questions suitable for the grade and topic. Use a mix of question types (multiple choice, fill-in-the-blank, word problems, etc.). Do NOT include any drawing or image-based questions, and do NOT reference images or diagrams.
2. Format the worksheet using clear HTML: use <h2> for the worksheet title, <ol> for the list of questions, and <li> for each question.
3. After the worksheet, provide an <h2>Answer Key</h2> section, with answers in an <ol> list matching the questions.
4. Do not include any explanations, just the questions and answers.
5. Do not include <!DOCTYPE> or <html>/<body> tags.

${input.specialRequest ? `Special Request: ${input.specialRequest}` : ''}
`;
    const response = await callOllamaGemma(prompt);
    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      return { worksheet: response, answerKey: '' };
    }
  }
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
        prompt: `You are an AI assistant for teachers. Your task is to generate a worksheet and a separate answer key in ${language}.\n\nTopic: ${topic}\nGrade Level: ${gradeLevel}\nNumber of Questions: ${numberOfQuestions}\n\n${specialRequest ? `Special Request: \"${specialRequest}\"\nPlease adhere to this request when generating questions.` : ''}\n\nInstructions:\n1.  Create a \"worksheet\" with the specified number of questions suitable for the given grade level. Format it using simple HTML tags (<h2>, <p>, <ol>, <li>).\n2.  Create a separate \"answerKey\" that contains the answers to the questions. This section should also be formatted in clean HTML and start with an <h2> heading titled \"Answer Key\".\n3.  Ensure your response is a valid JSON object containing both the \"worksheet\" and \"answerKey\" fields. Do not include <!DOCTYPE> or <html>/<body> tags in your HTML content.`,
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
