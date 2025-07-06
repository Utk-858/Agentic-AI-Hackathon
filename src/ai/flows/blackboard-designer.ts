'use server';
/**
 * @fileOverview An AI agent that designs chalkboard layouts for teachers.
 *
 * - blackboardDesigner - A function that handles the blackboard design process.
 * - BlackboardDesignerInput - The input type for the function.
 * - BlackboardDesignerOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

const BlackboardDesignerInputSchema = z.object({
  topic: z.string().describe('The core topic to be explained on the blackboard.'),
  gradeLevels: z.string().describe('The target grade level(s) for the explanation, e.g., "Class 3" or "Class 3 and 5".'),
  language: z.string().describe('The language for the explanation and labels.'),
  specialRequest: z.string().optional().describe('Any special requests, like "focus on the water cycle part" or "include a fun fact".'),
});
export type BlackboardDesignerInput = z.infer<typeof BlackboardDesignerInputSchema>;

const BlackboardDesignerOutputSchema = z.object({
  layoutImageUrl: z.string().describe("A data URI of the generated blackboard layout image in a simple, black-and-white, line-art style."),
  explanation: z.string().describe("An HTML-formatted text explanation of the layout, concepts, and grade-specific notes."),
  audioDataUri: z.string().describe("A data URI for the generated audio of the explanation in WAV format."),
});
export type BlackboardDesignerOutput = z.infer<typeof BlackboardDesignerOutputSchema>;

export async function blackboardDesigner(input: BlackboardDesignerInput): Promise<BlackboardDesignerOutput> {
  return blackboardDesignerFlow(input);
}

const blackboardDesignerFlow = ai.defineFlow(
  {
    name: 'blackboardDesignerFlow',
    inputSchema: BlackboardDesignerInputSchema,
    outputSchema: BlackboardDesignerOutputSchema,
  },
  async ({ topic, gradeLevels, language, specialRequest }) => {
    // 1. Generate the textual explanation
    const explanationPrompt = `You are "Board Buddy," an expert teaching assistant specializing in creating blackboard layouts.
Your task is to generate a detailed explanation for a blackboard diagram on the topic of "${topic}" for ${gradeLevels} in ${language}.

Instructions:
1.  **Describe the Layout:** Clearly explain where each visual element should be drawn on the board (e.g., "Top left: Sun," "Center: A diagram showing...").
2.  **Explain the Concept:** Provide a clear, step-by-step explanation of the topic.
3.  **Grade-Specific Annotations:** If multiple grade levels are mentioned, provide differentiated explanations. For example, a simpler explanation for a younger grade and a more detailed one for an older grade.
4.  **Format:** Structure the entire output as clean, well-formatted HTML. Use headings (<h2>, <h3>), paragraphs (<p>), and lists (<ul>, <li>). Do not include <!DOCTYPE>, <html>, or <body> tags.

${specialRequest ? `Special Request: "${specialRequest}". Please incorporate this into your explanation.` : ''}`;

    const explanationResponse = await ai.generate({
        prompt: explanationPrompt,
    });
    const explanation = explanationResponse.text ?? "Sorry, I could not generate an explanation.";

    // 2. Generate the blackboard layout image
    const imagePrompt = `Generate a blackboard layout diagram for the topic: "${topic}" for ${gradeLevels}.

**CRITICAL STYLE REQUIREMENTS:**
*   **Style:** The diagram must be an EXTREMELY simple, 2D, black-and-white line drawing.
*   **Appearance:** It should look exactly like it was drawn by a teacher with a single piece of white chalk on a clean, black blackboard. The background of the image MUST be pure black, and all lines and text MUST be pure white.
*   **Replicability:** The primary goal is that a teacher can easily and quickly replicate this by hand on a real blackboard. Avoid any artistic flair, shading, 3D effects, or complex details. Use only basic shapes (circles, squares, simple lines) and arrows.
*   **Labels:** All text and labels must be in ${language}, written in large, clear, uppercase block letters. Ensure the text is perfectly legible.
*   **Annotations:** If multiple grade levels are specified (${gradeLevels}), use clear, simple tags (e.g., "FOR CLASS 3", "FOR CLASS 5") to differentiate parts of the diagram where appropriate.

${specialRequest ? `Special Request for image: "${specialRequest}".` : ''}`;
    
    let imageUrl = '';
    try {
        const {media} = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: imagePrompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        imageUrl = media?.url || '';
    } catch(e) {
        console.error("Image generation failed. This can happen with the experimental model.", e);
        // imageUrl is already an empty string, so we gracefully continue
    }


    // 3. Generate audio for the explanation
    const textForTts = explanation.replace(/<[^>]*>?/gm, ' ').substring(0, 1000); // Truncate for TTS
    let audioUri = '';
    try {
        const {media} = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
                },
            },
            prompt: textForTts,
        });

        if (media) {
            const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
            audioUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
        }
    } catch (e) {
        console.error("TTS generation failed.", e);
    }
    
    return {
      layoutImageUrl: imageUrl,
      explanation: explanation,
      audioDataUri: audioUri,
    };
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) { bufs.push(d); });
    writer.on('end', function () { resolve(Buffer.concat(bufs).toString('base64')); });
    writer.write(pcmData);
    writer.end();
  });
}
