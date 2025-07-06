'use server';

/**
 * @fileOverview An AI-powered timetable generator for schools.
 *
 * - generateTimetable - A function that generates a weekly timetable based on various constraints.
 */

import {ai} from '@/ai/genkit';
import { GenerateTimetableInput, GenerateTimetableInputSchema, GenerateTimetableOutput, GenerateTimetableOutputSchema } from '@/ai/schemas';

export async function generateTimetable(input: GenerateTimetableInput): Promise<GenerateTimetableOutput> {
  return generateTimetableFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateTimetablePrompt',
  input: {schema: GenerateTimetableInputSchema},
  output: {schema: GenerateTimetableOutputSchema},
  prompt: `You are an expert school administrator specializing in creating optimized, clash-free weekly timetables. Your task is to generate a schedule based on the provided JSON data.

You MUST adhere to these HARD CONSTRAINTS:
1.  A teacher cannot teach two classes at the same time.
2.  A room cannot be used for two classes at the same time.
3.  The room must have the capacity for the class and be of the correct type (e.g., lab for lab sessions).
4.  A teacher's total teaching hours must not exceed their weekly maximum.
5.  Do not schedule anything during the specified daily break times. These apply every day.
6.  Do not schedule anything on specified holidays.

You should aim to satisfy these SOFT CONSTRAINTS for a high-quality timetable:
1.  Minimize idle gaps between classes for both teachers and students.
2.  Avoid scheduling more than 3 consecutive lectures for any class.
3.  Prefer to group lab sessions together in longer, continuous blocks if possible.
4.  Distribute the teaching load as evenly as possible among teachers.

Here is the data you must use for scheduling. All inputs are JSON-formatted strings:
- Time Slots: {{{timeSlots}}}
- Breaks: {{{breaks}}}
- Subjects per Class: {{{subjectsPerClass}}}
- Faculty Details: {{{faculty}}}
- Room Details: {{{rooms}}}
- Class Details: {{{classDetails}}}
- Holidays: {{{holidays}}}

{{#if specialDemands}}
In addition to the above, you must also consider these SPECIAL DEMANDS from the teacher. Treat these as very important soft constraints:
"{{{specialDemands}}}"
{{/if}}

Please analyze all constraints and data to create the most optimal 5-day (Monday to Friday) weekly timetable. The output must be a JSON object that strictly conforms to the defined output schema, with each day of the week as a key.`,
});


const generateTimetableFlow = ai.defineFlow(
  {
    name: 'generateTimetableFlow',
    inputSchema: GenerateTimetableInputSchema,
    outputSchema: GenerateTimetableOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate timetable. The AI model did not return a valid response.');
    }
    return output;
  }
);
