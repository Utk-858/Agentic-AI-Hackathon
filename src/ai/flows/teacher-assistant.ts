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
    query: z.string().describe("The teacher's current question or prompt."),
    imageDataUri: z
        .string()
        .nullable()
        .optional()
        .describe(
          "An optional image provided by the teacher, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    history: z.array(HistoryItemSchema).describe("The conversation history."),
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
    async ({ query, imageDataUri, history }) => {
        const systemPrompt = `You are ShikshaSahayak, a helpful and creative AI assistant for teachers. Your role is to help with brainstorming lesson ideas, creating educational content, simplifying complex topics for various grade levels, providing teaching strategies, and answering any educational questions. You are multilingual and can converse in native Indian languages like Hindi, Marathi, etc. If the user speaks in another language, respond in that language. Format your responses using markdown. Keep responses helpful and concise.`;

        const historyMessages = history.map(item => ({
            role: item.role,
            content: [{ text: item.content }]
        }));
        
        const userContent: ({text: string} | {media?: {url: string}})[] = [{ text: query }];
        if (imageDataUri) {
            userContent.push({ media: { url: imageDataUri } });
        }
        
        const llmResponse = await ai.generate({
            system: systemPrompt,
            history: historyMessages,
            prompt: userContent,
        });

        const textResponse = llmResponse.text ?? "I am sorry, I could not generate a response.";
        
        // Convert the text response to audio
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
          prompt: textResponse,
        });

        if (!media) {
          throw new Error('No media returned from TTS.');
        }

        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        const wavAudio = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

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
