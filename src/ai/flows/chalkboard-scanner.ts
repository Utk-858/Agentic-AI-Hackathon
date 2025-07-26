'use server';
/**
 * @fileOverview An AI agent that scans a chalkboard image and converts it to digital notes and audio.
 *
 * - chalkboardScanner - A function that handles the scanning process.
 * - ChalkboardScannerInput - The input type for the chalkboardScanner function.
 * - ChalkboardScannerOutput - The return type for the chalkboardScanner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import fetch from 'node-fetch';

const ChalkboardScannerInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a chalkboard or whiteboard, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  isOnline: z.boolean().optional().describe('Whether to use online (Gemini) or offline (Tesseract+Gemma) mode.'),
});
export type ChalkboardScannerInput = z.infer<typeof ChalkboardScannerInputSchema>;

const ChalkboardScannerOutputSchema = z.object({
  htmlContent: z.string().describe('The transcribed and described content from the image, formatted as clean HTML.'),
  audioDataUri: z.string().describe('A data URI for the generated audio of the content in WAV format.'),
});
export type ChalkboardScannerOutput = z.infer<typeof ChalkboardScannerOutputSchema>;

export async function chalkboardScanner(input: ChalkboardScannerInput): Promise<ChalkboardScannerOutput> {
  // Only online mode (Gemini) is supported. No Tesseract.js, no offline OCR.
  return chalkboardScannerFlow(input);
}

const chalkboardScannerFlow = ai.defineFlow(
  {
    name: 'chalkboardScannerFlow',
    inputSchema: ChalkboardScannerInputSchema,
    outputSchema: ChalkboardScannerOutputSchema,
  },
  async ({ imageDataUri }) => {
    // 1. Generate the HTML content from the image
    const visionPrompt = `You are an expert "Chalkboard Scanner". Your task is to analyze the provided image of a chalkboard, whiteboard, or piece of paper.

Instructions:
1.  **Transcribe Text:** Accurately transcribe all written text from the image. Maintain the original structure and hierarchy as much as possible.
2.  **Describe Diagrams:** If you encounter any diagrams, charts, flowcharts, or other visual elements, describe them clearly and concisely. For example, "A flowchart showing the process of photosynthesis" or "A diagram of a plant cell with labels for the nucleus, cytoplasm, and cell wall."
3.  **Format Output:** Structure the entire output as clean, well-formatted HTML. Use headings (<h2>, <h3>), paragraphs (<p>), and lists (<ul>, <li>) for maximum readability. Do not include a <!DOCTYPE>, <html>, or <body> tag. Ensure the output is immediately ready to be rendered in a div.
4.  **If you cannot extract any text, return the message: <p>No readable content found. Please try a clearer image.</p>**
5.  **Always output at least a <p>...</p> block, even if the image is blank.**
`;
    
    const llmResponse = await ai.generate({
        prompt: [
            { text: visionPrompt },
            { media: { url: imageDataUri } }
        ],
    });

    const htmlContent = llmResponse.text ?? "<p>No readable content found. Please try a clearer image.</p>";

    // Debug logging
    console.log('[chalkboardScanner] Gemini llmResponse:', llmResponse);
    console.log('[chalkboardScanner] htmlContent:', htmlContent);

    // 2. Convert the generated HTML content to audio, handling potential rate-limit errors
    const textForTts = htmlContent.replace(/<[^>]*>?/gm, ' '); // Strip HTML tags for TTS
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
            prompt: textForTts,
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
      htmlContent: htmlContent,
      audioDataUri: wavAudio,
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
