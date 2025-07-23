'use server';

/**
 * @fileOverview A lesson plan generation AI agent.
 *
 * - generateLessonPlan - A function that handles the lesson plan generation process.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import { ai } from '@/ai/genkit';
import { callOllamaGemma } from '@/ai/ollama';
import { z } from 'genkit';

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

export async function generateLessonPlan(input: GenerateLessonPlanInput, isOnline: boolean): Promise<GenerateLessonPlanOutput> {
  if (isOnline) {
    return await generateLessonPlanFlow(input);
  } else {
    let prompt = `
You are an expert elementary school teacher. Create a detailed, engaging, and creative lesson plan for the following:

- Topic: ${input.topic}
- Grade Level: ${input.gradeLevel}
- Duration: ${input.duration || 'As appropriate'}
- Language: ${input.language}

Format the lesson plan using ONLY the following HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>. Do NOT use Markdown or any other formatting.

Sections to include (each with a <h2> heading):

<h2>Objectives</h2>
<ul>
  <li>Each objective as a bullet point, use <strong> for key terms.</li>
</ul>

<h2>Materials</h2>
<ul>
  <li>List each material as a bullet point.</li>
</ul>

<h2>Procedure</h2>
Use <h3> for sub-sections (e.g., Introduction, Activity, Discussion). For each step, use <p> for instructions and <ul> for lists if needed.

<h2>Assessment</h2>
<p>Describe assessment methods.</p>

<h2>Key Vocabulary</h2>
<ul>
  <li>Each term in <strong>bold</strong> with a short definition.</li>
</ul>

<h2>Extension Ideas</h2>
<ul>
  <li>Each idea as a bullet point.</li>
</ul>

Instructions:
- Do NOT include a worksheet or answer key.
- Do NOT include <!DOCTYPE> or <html>/<body> tags.
- Do NOT use Markdown.
- Use only the specified HTML tags.

${input.specialRequest ? `Special Request: ${input.specialRequest}` : ''}
`;
    const lessonPlan = await callOllamaGemma(prompt);
    return { lessonPlan };
  }
}

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async ({ topic, gradeLevel, language, specialRequest, duration }) => {
    let prompt = `You are an expert teacher specializing in creating lesson plans.\n\nYou will use the topic and grade level to generate a lesson plan. The lesson plan should be in the specified language.\n\nTopic: ${topic}\nGrade Level: ${gradeLevel}\nLanguage: ${language}`;

    if (duration) {
      prompt += `\nDuration: ${duration}`;
    }

    if (specialRequest) {
      prompt += `\n\nSpecial Request: \"${specialRequest}\"\nPlease take this special request into account.`;
    }

    prompt += `\n\nPlease create a detailed lesson plan that fits within the specified duration. Format the plan using simple HTML tags. Use <h2> for main headings (like Objectives, Materials), <h3> for sub-headings, <p> for paragraphs, and <ul>/<li> for lists. Do not include a <!DOCTYPE> or <html>/<body> tags. Ensure the output is clean, well-structured, and easy to read.`;

    const result = await ai.generate({
      prompt: prompt,
    });

    const lessonPlan = result.text ?? "Sorry, I couldn't generate a lesson plan. Please try again.";
    
    return { lessonPlan };
  }
);
