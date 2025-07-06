'use server';
/**
 * @fileOverview A conversational AI tutor that maintains context.
 *
 * - conversationalTutor - A function that provides tutoring based on conversation history.
 * - ConversationalTutorInput - The input type for the conversationalTutor function.
 * - ConversationalTutorOutput - The return type for the conversationalTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HistoryItemSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const ConversationalTutorInputSchema = z.object({
    query: z.string().describe("The student's current question or prompt."),
    imageDataUri: z
        .string()
        .nullable()
        .optional()
        .describe(
          "An optional image provided by the student, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
    history: z.array(HistoryItemSchema).describe("The conversation history."),
    userGender: z.enum(['male', 'female', 'neutral']).optional().describe("The user's selected gender to ensure correct pronouns are used."),
});
export type ConversationalTutorInput = z.infer<typeof ConversationalTutorInputSchema>;

const ConversationalTutorOutputSchema = z.object({
    response: z.string().describe("The AI tutor's response to the student."),
});
export type ConversationalTutorOutput = z.infer<typeof ConversationalTutorOutputSchema>;

export async function conversationalTutor(input: ConversationalTutorInput): Promise<ConversationalTutorOutput> {
    return conversationalTutorFlow(input);
}

const conversationalTutorFlow = ai.defineFlow(
    {
        name: 'conversationalTutorFlow',
        inputSchema: ConversationalTutorInputSchema,
        outputSchema: ConversationalTutorOutputSchema,
    },
    async ({ query, imageDataUri, history, userGender }) => {
        const systemPrompt = `You are a friendly and helpful AI tutor called VidyaSutra. You have a male voice and persona. When referring to yourself, use male-gendered language (e.g., in Hindi, say "मैं आपकी मदद कर सकता हूँ", not "कर सकती हूँ").

The user's gender is '${userGender || 'not specified'}'. Please use appropriate pronouns (he/him for male, she/her for female, they/them for neutral/not specified).

You MUST detect the language the user is communicating in and respond in that same language. You are proficient in multiple languages, including native Indian languages like Hindi, Marathi, Bengali, Tamil, etc.

Maintain a conversation history and ensure your responses are contextual. Be encouraging and break down complex ideas into simple, easy-to-understand explanations. Format your response using simple HTML tags (like <strong>, <em>, <ul>, <li>). Do not include a <!DOCTYPE> or <html>/<body> tags.`;

        const historyMessages = history.map(item => ({
            role: item.role,
            content: [{ text: item.content }]
        }));
        
        const userContent: ({text: string} | {media?: {url: string}})[] = [{ text: query }];
        if (imageDataUri) {
            userContent.push({ media: { url: imageDataUri } });
        }
        
        const result = await ai.generate({
            system: systemPrompt,
            history: historyMessages,
            prompt: userContent,
        });
        
        return { response: result.text ?? "I am sorry, I could not generate a response." };
    }
);
