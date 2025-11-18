'use server';

/**
 * @fileOverview An AI-powered chat safety tool that scans messages and suggests safety measures.
 *
 * - aiPoweredChatSafety - A function that handles the chat safety process.
 * - AIPoweredChatSafetyInput - The input type for the aiPoweredChatSafety function.
 * - AIPoweredChatSafetyOutput - The return type for the aiPoweredChatSafety function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredChatSafetyInputSchema = z.object({
  message: z.string().describe('The message to be scanned for safety.'),
});
export type AIPoweredChatSafetyInput = z.infer<typeof AIPoweredChatSafetyInputSchema>;

const AIPoweredChatSafetyOutputSchema = z.object({
  suggestedActions: z
    .array(z.string())
    .describe(
      'A list of suggested safety actions, such as disabling images, blurring content, or taking additional safety measures.'
    ),
  safetyScore: z.number().describe('A score indicating the safety level of the message.'),
});
export type AIPoweredChatSafetyOutput = z.infer<typeof AIPoweredChatSafetyOutputSchema>;

export async function aiPoweredChatSafety(input: AIPoweredChatSafetyInput): Promise<AIPoweredChatSafetyOutput> {
  return aiPoweredChatSafetyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredChatSafetyPrompt',
  input: {schema: AIPoweredChatSafetyInputSchema},
  output: {schema: AIPoweredChatSafetyOutputSchema},
  prompt: `You are an AI-powered chat safety tool that helps protect users during chat by scanning messages in real-time.
  Your job is to scan the message and suggest when to disable images, blur questionable content, or take additional safety measures, so users can feel safer and more secure while communicating with others on the platform.

  Message: {{{message}}}

  Consider the following:
  - Is the message harassing, bullying, or abusive?
  - Does the message contain sexually explicit content?
  - Does the message contain hate speech or promote violence?
  - Does the message contain personal information that should not be shared?

  Based on your analysis, provide a list of suggested safety actions and a safety score (0-100, where 0 is completely unsafe and 100 is completely safe).

  The suggestedActions field must be a list of strings, each string describing an action.
  Example: ["Disable images", "Blur content", "Take additional safety measures"]

  Output should conform to the following JSON schema:
  {
    "suggestedActions": [string], // A list of suggested safety actions
    "safetyScore": number // A score indicating the safety level of the message
  }`,
});

const aiPoweredChatSafetyFlow = ai.defineFlow(
  {
    name: 'aiPoweredChatSafetyFlow',
    inputSchema: AIPoweredChatSafetyInputSchema,
    outputSchema: AIPoweredChatSafetyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
