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
import { callOllamaGemma } from '@/ai/ollama';

export async function worksheetAutoCorrector(
  input: WorksheetAutoCorrectorInput & { isOnline: boolean }
): Promise<WorksheetAutoCorrectorOutput> {
  if (input.isOnline) {
    return worksheetAutoCorrectorFlow(input);
  } else {
    // Reconstruct the prompt as in the original flow
    const promptText = `You are an expert teacher and grader. You will be given two images:
- The first image is a student's completed worksheet.
- The second image is the answer key for the worksheet.

Instructions:
1. Extract the text from both images.
2. Compare the student's answers to the answer key.
3. Grade the worksheet, giving a score out of the total number of questions.
4. List the questions the student got wrong, and provide brief feedback for each.
5. Return ONLY a valid JSON object in this format (all values must be numbers or strings, not objects):
{
  "score": <number>,
  "total": <number>,
  "wrongQuestions": [
    {
      "questionNumber": <number>,
      "studentAnswer": "<text>",
      "correctAnswer": "<text>",
      "feedback": "<text>"
    }
  ]
}
Do not include any explanations, comments, or extra text. All values must be numbers or strings as shown.
${input.specialRequest ? `Special Grading Instructions: Please follow these special requests while grading: "${input.specialRequest}"` : ''}

Now, please grade the worksheet and provide the score and feedback in ${input.language}.
`;

    // Send both prompt and images to Ollama (vision model)
    const responseText = await callOllamaGemma(
      promptText,
      [input.studentWorksheetDataUri, input.answerKeyDataUri]
    );

    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        const result = JSON.parse(match[0]);
        // Defensive parsing: ensure score and total are numbers
        if (typeof result.score !== 'number') {
          result.score = Number(result.score) || 0;
        }
        if (typeof result.total !== 'number') {
          if (typeof result.total === 'object' && result.total !== null) {
            // Try to find a number inside the object
            const values = Object.values(result.total).filter(v => typeof v === 'number');
            result.total = values.length > 0 ? values[0] : 0;
          } else {
            result.total = Number(result.total) || 0;
          }
        }
        return result;
      }
      throw new Error('No JSON found in response');
    } catch (err) {
      throw new Error('Failed to parse grading result: ' + (err as Error).message);
    }
  }
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
