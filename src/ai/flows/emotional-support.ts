'use server';

/**
 * @fileOverview A conversational AI for emotional support.
 *
 * - emotionalSupport - A function that provides conversational emotional support.
 * - EmotionalSupportInput - The input type for the emotionalSupport function.
 * - EmotionalSupportOutput - The return type for the emotionalSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const HistoryItemSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const EmotionalSupportInputSchema = z.object({
  query: z.string().describe("The user's current message."),
  history: z.array(HistoryItemSchema).describe("The conversation history."),
});
export type EmotionalSupportInput = z.infer<typeof EmotionalSupportInputSchema>;

const EmotionalSupportOutputSchema = z.object({
  response: z.string().describe("The AI's textual response."),
  media: z.string().describe('Audio data of the response in WAV format as a data URI.'),
});
export type EmotionalSupportOutput = z.infer<typeof EmotionalSupportOutputSchema>;

export async function emotionalSupport(input: EmotionalSupportInput): Promise<EmotionalSupportOutput> {
  return emotionalSupportFlow(input);
}


const emotionalSupportFlow = ai.defineFlow(
  {
    name: 'emotionalSupportFlow',
    inputSchema: EmotionalSupportInputSchema,
    outputSchema: EmotionalSupportOutputSchema,
  },
  async ({ query, history }) => {
    const systemPrompt = `You are SwasthyaMitra, a friendly, empathetic, and confidential AI emotional support companion. Your role is to listen to the user, provide a safe space for them to express their feelings, and offer gentle, supportive guidance. You are not a therapist, but a caring friend. You are multilingual and can converse in native Indian languages like Hindi, Marathi, Bengali, Tamil, etc. If the user speaks in another language, respond in that language. Keep your responses concise and comforting.`;

    const historyMessages = history.map(item => ({
        role: item.role,
        content: [{ text: item.content }]
    }));

    // 1. Generate the text response
    const llmResponse = await ai.generate({
        system: systemPrompt,
        history: historyMessages,
        prompt: query,
    });
    
    const textResponse = llmResponse.text ?? "I am here to listen. Please tell me more.";

    // 2. Convert the text response to audio
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
