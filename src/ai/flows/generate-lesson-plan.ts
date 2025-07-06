'use server';

/**
 * @fileOverview A lesson plan generation AI agent.
 *
 * - generateLessonPlan - A function that handles the lesson plan generation process.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonPlanInputSchema = z.object({
  topic: z.string().describe('The topic of the lesson plan.'),
  gradeLevel: z.string().describe('The grade level for the lesson plan.'),
  duration: z.string().optional().describe('The desired duration of the lesson (e.g., "45 minutes").'),
  language: z.string().describe('The language of the lesson plan.'),
  specialRequest: z.string().optional().describe('Any special requests or other important considerations.'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

const GenerateLessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan.'),
});
export type GenerateLessonPlanOutput = z.infer<typeof GenerateLessonPlanOutputSchema>;

export async function generateLessonPlan(input: GenerateLessonPlanInput): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async ({ topic, gradeLevel, language, specialRequest, duration }) => {
    let prompt = `You are an expert teacher specializing in creating lesson plans.

You will use the topic and grade level to generate a lesson plan. The lesson plan should be in the specified language.

Topic: ${topic}
Grade Level: ${gradeLevel}
Language: ${language}`;

    if (duration) {
      prompt += `\nDuration: ${duration}`;
    }

    if (specialRequest) {
      prompt += `\n\nSpecial Request: "${specialRequest}"\nPlease take this special request into account.`;
    }

    prompt += `\n\nPlease create a detailed lesson plan that fits within the specified duration. Format the plan using simple HTML tags. Use <h2> for main headings (like Objectives, Materials), <h3> for sub-headings, <p> for paragraphs, and <ul>/<li> for lists. Do not include a <!DOCTYPE> or <html>/<body> tags. Ensure the output is clean, well-structured, and easy to read.`;

    const result = await ai.generate({
      prompt: prompt,
    });

    const lessonPlan = result.text ?? "Sorry, I couldn't generate a lesson plan. Please try again.";
    
    return { lessonPlan };
  }
);
