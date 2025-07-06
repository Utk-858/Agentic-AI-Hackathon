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
  query: z.string().optional().describe("The user's current text message."),
  audioDataUri: z.string().optional().describe("The user's current audio message as a data URI."),
  history: z.array(HistoryItemSchema).describe("The conversation history."),
}).refine(data => data.query || data.audioDataUri, {
  message: "Either a text query or an audio message must be provided.",
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
  async ({ query, audioDataUri, history }) => {
    const systemPrompt = `You are SwasthyaMitra, a friendly, empathetic, and confidential AI emotional support companion. Your primary role is to listen to the user, provide a safe space for them to express their feelings, and offer gentle, supportive guidance. You have a male voice and persona. When referring to yourself, use male-gendered language (e.g., in Hindi, say "मैं आपकी मदद कर सकता हूँ", not "कर सकती हूँ").

You are not a therapist, but a caring friend.

You MUST detect the language the user is communicating in (whether through text or audio) and respond in that same language. You are proficient in multiple languages, including native Indian languages like Hindi, Marathi, Bengali, Tamil, etc.

Keep your responses concise and comforting. Format your response using simple HTML tags (like <p>, <strong>). Do not include a <!DOCTYPE> or <html>/<body> tags.`;

    const historyMessages = history.map(item => ({
        role: item.role,
        content: [{ text: item.content }]
    }));

    const promptContent: ({text: string} | {media: {url: string}})[] = [];
    if (audioDataUri) {
        promptContent.push({ media: { url: audioDataUri } });
        promptContent.push({ text: "The user has provided an audio message. Please analyze it, determine the language, and provide a supportive response in that same language." });
    } else {
        promptContent.push({ text: query! });
    }

    // 1. Generate the text response
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemPrompt,
        history: historyMessages,
        prompt: promptContent,
    });
    
    const textResponse = llmResponse.text ?? "I am here to listen. Please tell me more.";

    // 2. Convert the text response to audio, handling potential rate-limit errors
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
    } catch (e) {
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
