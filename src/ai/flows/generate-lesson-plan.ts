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
  language: z.string().describe('The language of the lesson plan.'),
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
  async ({ topic, gradeLevel, language }) => {
    const prompt = `You are an expert teacher specializing in creating lesson plans.

You will use the topic and grade level to generate a lesson plan. The lesson plan should be in the specified language.

Topic: ${topic}
Grade Level: ${gradeLevel}
Language: ${language}

Generate a detailed lesson plan formatted in markdown. Include objectives, materials, activities, and assessment methods.`;

    const result = await ai.generate({
      prompt: prompt,
    });

    const lessonPlan = result.text ?? "Sorry, I couldn't generate a lesson plan. Please try again.";
    
    return { lessonPlan };
  }
);