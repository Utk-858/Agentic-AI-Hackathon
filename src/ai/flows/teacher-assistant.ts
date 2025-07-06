'use server';
/**
 * @fileOverview A conversational AI assistant for teachers with text and audio output.
 *
 * - teacherAssistant - A function that provides assistance based on conversation history.
 * - TeacherAssistantInput - The input type for the teacherAssistant function.
 * - TeacherAssistantOutput - The return type for the teacherAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const HistoryItemSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const TeacherAssistantInputSchema = z.object({
    query: z.string().optional().describe("The teacher's current text message."),
    audioDataUri: z.string().optional().describe("The teacher's current audio message as a data URI."),
    imageDataUri: z
        .string()
        .nullable()
        .optional()
        .describe(
          "An optional image provided by the teacher, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    history: z.array(HistoryItemSchema).describe("The conversation history."),
}).refine(data => data.query || data.audioDataUri, {
  message: "Either a text query or an audio message must be provided.",
});
export type TeacherAssistantInput = z.infer<typeof TeacherAssistantInputSchema>;

const TeacherAssistantOutputSchema = z.object({
    response: z.string().describe("The AI assistant's textual response to the teacher."),
    media: z.string().describe('Audio data of the response in WAV format as a data URI.'),
});
export type TeacherAssistantOutput = z.infer<typeof TeacherAssistantOutputSchema>;

export async function teacherAssistant(input: TeacherAssistantInput): Promise<TeacherAssistantOutput> {
    return teacherAssistantFlow(input);
}

const teacherAssistantFlow = ai.defineFlow(
    {
        name: 'teacherAssistantFlow',
        inputSchema: TeacherAssistantInputSchema,
        outputSchema: TeacherAssistantOutputSchema,
    },
    async ({ query, audioDataUri, imageDataUri, history }) => {
        const systemPrompt = `You are ShikshaSahayak, a helpful and creative AI assistant for teachers. You have a male voice and persona. When referring to yourself, use male-gendered language (e.g., in Hindi, say "मैं आपकी मदद कर सकता हूँ", not "कर सकती हूँ").

Your role is to help with brainstorming lesson ideas, creating educational content, simplifying complex topics, and teaching strategies.

You MUST detect the language the user is communicating in (whether through text or audio) and respond in that same language. You are proficient in multiple languages, including native Indian languages like Hindi, Marathi, Bengali, Tamil, etc.

Format your responses using simple HTML tags (like <strong>, <em>, <ul>, <li>). Do not include a <!DOCTYPE> or <html>/<body> tags. Keep responses helpful and concise.`;

        const historyMessages = history.map(item => ({
            role: item.role,
            content: [{ text: item.content }]
        }));
        
        const userContent: ({text: string} | {media?: {url: string}})[] = [];
        if (audioDataUri) {
            userContent.push({ media: { url: audioDataUri } });
            userContent.push({ text: "The user has provided an audio message. Please analyze it, determine the language, and provide a helpful response in that same language." });
        } else {
            userContent.push({ text: query! });
        }

        if (imageDataUri) {
            userContent.push({ media: { url: imageDataUri } });
        }
        
        const llmResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: systemPrompt,
            history: historyMessages,
            prompt: userContent,
        });

        const textResponse = llmResponse.text ?? "I am sorry, I could not generate a response.";
        
        // Convert the text response to audio, handling potential rate-limit errors
        let wavAudio = '';
        try {
            const {media} = await ai.generate({
              model: 'googleai/gemini-2.5-flash-preview-tts',
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {voiceName: 'Algenib'},
                  },
                },
              },
              prompt: textResponse.replace(/<[^>]*>?/gm, ''), // Strip HTML tags for TTS
            });

            if (media) {
                const audioBuffer = Buffer.from(
                  media.url.substring(media.url.indexOf(',') + 1),
                  'base64'
                );
                wavAudio = 'data:audio/wav;base64,' + (await toWav(audioBuffer));
            }
        } catch(e) {
            console.error("TTS generation failed, likely due to rate limiting. Returning text only.", e);
            // wavAudio is already an empty string, so we gracefully continue
        }

        return {
          response: textResponse,
          media: wavAudio,
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
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
