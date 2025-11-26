'use server';

/**
 * @fileOverview An AI-powered flow that generates a custom meditation script.
 *
 * - generateMeditationScript - A function that handles the script generation.
 * - GenerateMeditationScriptInput - The input type for the function.
 * - GenerateMeditationScriptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMeditationScriptInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the meditation, e.g., "help me relax" or "focus for 5 minutes".'),
});
export type GenerateMeditationScriptInput = z.infer<typeof GenerateMeditationScriptInputSchema>;

const GenerateMeditationScriptOutputSchema = z.object({
  script: z.string().describe('The generated meditation script, ready for text-to-speech.'),
});
export type GenerateMeditationScriptOutput = z.infer<typeof GenerateMeditationScriptOutputSchema>;

export async function generateMeditationScript(input: GenerateMeditationScriptInput): Promise<GenerateMeditationScriptOutput> {
  return generateMeditationScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeditationScriptPrompt',
  input: { schema: GenerateMeditationScriptInputSchema },
  output: { schema: GenerateMeditationScriptOutputSchema },
  prompt: `You are a world-class wellness and meditation coach. Your task is to generate a short, calming, and effective guided meditation script based on a user's request.

The script should be clear, concise, and easy to follow. It should be written in a soothing and gentle tone.
The script should be between 100 and 200 words.

User's Request: {{{prompt}}}

Generate a meditation script that directly addresses the user's request.
The output should be only the script text, without any introductory or concluding remarks.`,
});

const generateMeditationScriptFlow = ai.defineFlow(
  {
    name: 'generateMeditationScriptFlow',
    inputSchema: GenerateMeditationScriptInputSchema,
    outputSchema: GenerateMeditationScriptOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
