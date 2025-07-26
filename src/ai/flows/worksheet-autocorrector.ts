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
    const result = await worksheetAutoCorrectorFlow(input);
    let score = 0;
    let total = 0;
    if (Array.isArray((result as any).comparisons) && (result as any).comparisons.length > 0) {
      total = (result as any).comparisons.length;
      score = (result as any).comparisons.filter((c: any) => c.isCorrect === true).length;
    } else if (Array.isArray((result as any).extractedQuestions) && (result as any).extractedQuestions.length > 0) {
      total = (result as any).extractedQuestions.length;
      score = 0;
    }
    return {
      score,
      total,
      feedback: result.feedback || '',
    };
  } else {
    // OFFLINE: Improved prompt and robust score calculation, no summaryTable
    const promptText = `You are an expert teacher and grader. You will be given two images:
- The first image is a student's completed worksheet.
- The second image is the answer key for the worksheet.

Instructions:
1. Extract the text from both images. First, list all the questions and their correct answers you extract from the answer key image as an array called "extractedQuestions" (each item: {"questionNumber": <number>, "questionText": "<text>", "correctAnswer": "<text>"}).
2. Then, list all the answers you extract from the student's worksheet as an array called "extractedStudentAnswers" (each item: {"questionNumber": <number>, "studentAnswer": "<text>"}).
3. For each question, compare the student's answer to the correct answer from the answer key. Do NOT copy the student's answer as the expected answer. Use only the answer key image for correct answers. If you are unsure, mark as incorrect. If the student's answer matches the correct answer, mark isCorrect true, otherwise false. Never copy the student's answer as the correct answer.
4. Output a JSON array called "comparisons". Each item: {"questionNumber": <number>, "questionText": "<text>", "studentAnswer": "<text>", "correctAnswer": "<text>", "isCorrect": <true|false>}.
5. List the questions the student got wrong, and provide brief feedback for each in a "wrongQuestions" array.
6. Return ONLY a valid JSON object in this format (all values must be numbers or strings, not objects unless specified):
{
  "comparisons": [ { "questionNumber": <number>, "questionText": "<text>", "studentAnswer": "<text>", "correctAnswer": "<text>", "isCorrect": <true|false> } ],
  "wrongQuestions": [ { "questionNumber": <number>, "studentAnswer": "<text>", "correctAnswer": "<text>", "feedback": "<text>" } ],
  "extractedQuestions": [ { "questionNumber": <number>, "questionText": "<text>", "correctAnswer": "<text>" } ],
  "extractedStudentAnswers": [ { "questionNumber": <number>, "studentAnswer": "<text>" } ]
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

    // Debug: log the raw model output
    console.log('[worksheetAutoCorrector] Raw model output:', responseText);

    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        const result = JSON.parse(match[0]);
        // Debug: log the parsed result
        console.log('[worksheetAutoCorrector] Parsed result:', result);
        // Defensive: ensure comparisons is an array
        let score = 0;
        let total = 0;
        if (Array.isArray(result.comparisons) && result.comparisons.length > 0) {
          total = result.comparisons.length;
          score = result.comparisons.filter((c: any) => c.isCorrect === true).length;
        } else if (Array.isArray(result.extractedQuestions) && result.extractedQuestions.length > 0) {
          total = result.extractedQuestions.length;
          score = 0;
        }
        return {
          score,
          total,
          feedback: result.feedback || '',
        };
      }
      console.error('[worksheetAutoCorrector] No JSON found in response:', responseText);
      throw new Error('No JSON found in response');
    } catch (err) {
      console.error('[worksheetAutoCorrector] Failed to parse grading result:', err, 'Raw output:', responseText);
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
