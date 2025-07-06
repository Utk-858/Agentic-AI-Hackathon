'use server';
/**
 * @fileOverview An AI-powered worksheet auto-corrector.
 * This file defines the `worksheetAutoCorrector` server action.
 * The input and output types for this action are defined in `src/ai/schemas.ts`.
 */

import {ai} from '@/ai/genkit';
import {
  type WorksheetAutoCorrectorInput,
  WorksheetAutoCorrectorInputSchema,
  type WorksheetAutoCorrectorOutput,
  WorksheetAutoCorrectorOutputSchema,
} from '@/ai/schemas';

export async function worksheetAutoCorrector(
  input: WorksheetAutoCorrectorInput
): Promise<WorksheetAutoCorrectorOutput> {
  return worksheetAutoCorrectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'worksheetAutoCorrectorPrompt',
  input: {schema: WorksheetAutoCorrectorInputSchema},
  output: {schema: WorksheetAutoCorrectorOutputSchema},
  prompt: `You are an expert AI teaching assistant, GradingAgent. Your task is to grade a student's worksheet by comparing it to an answer key. You must analyze two images: one of the student's work and one of the answer key.

Your instructions are:
1.  **Analyze both images:** Use OCR to read the text from the student's worksheet and the answer key.
2.  **Compare Answers:** For each question, compare the student's answer to the correct answer from the key.
3.  **Handle Different Question Types:** Be prepared to grade Multiple Choice Questions (MCQs), Fill-in-the-Blanks (FIBs), and one-line short answers. For short answers, allow for minor spelling variations.
4.  **Calculate Score:** Count the number of correct answers and the total number of questions to determine the score.
5.  **Provide Feedback:** Generate a summary of the mistakes, starting with a heading like \`<h3>Detailed Feedback</h3>\`. For each incorrect answer, list the question, the student's answer, and the correct answer. Use lists (<ul> and <li>) for clarity.
6.  **Language:** Provide all feedback in the specified language: {{{language}}}.
7.  **Return JSON:** Respond ONLY with a valid JSON object matching the defined output schema.

Student's Worksheet:
{{media url=studentWorksheetDataUri}}

Answer Key:
{{media url=answerKeyDataUri}}

{{#if specialRequest}}
Special Grading Instructions: Please follow these special requests while grading: "{{{specialRequest}}}"
{{/if}}

Now, please grade the worksheet and provide the score and feedback in {{{language}}}.
`,
});

const worksheetAutoCorrectorFlow = ai.defineFlow(
  {
    name: 'worksheetAutoCorrectorFlow',
    inputSchema: WorksheetAutoCorrectorInputSchema,
    outputSchema: WorksheetAutoCorrectorOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid response for grading.');
    }
    return output;
  }
);
