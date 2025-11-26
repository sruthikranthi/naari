'use server';
import {
  aiPoweredChatSafety,
  type AIPoweredChatSafetyOutput,
} from '@/ai/flows/ai-powered-chat-safety';
import { generateMeditationScript } from '@/ai/flows/generate-meditation-script';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { z } from 'zod';

const safetyCheckSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type SafetyCheckState = {
  result?: AIPoweredChatSafetyOutput;
  error?: string;
  message: string;
};

export async function checkMessageSafety(
  prevState: SafetyCheckState,
  formData: FormData
): Promise<SafetyCheckState> {
  const validatedFields = safetyCheckSchema.safeParse({
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.message?.join(', '),
      message: '',
    };
  }

  try {
    const result = await aiPoweredChatSafety({
      message: validatedFields.data.message,
    });
    return { result, message: validatedFields.data.message };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to analyze message.', message: '' };
  }
}

const ttsSchema = z.object({
  text: z.string(),
});

export type TextToSpeechOutput = {
  media: string;
};

type TtsState = {
  result?: TextToSpeechOutput;
  error?: string;
};

export async function getAudio(
  prevState: TtsState,
  formData: FormData
): Promise<TtsState> {
  const validatedFields = ttsSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Text is required.',
    };
  }

  try {
    const result = await textToSpeech(validatedFields.data.text);
    return { result };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate audio.' };
  }
}

const customMeditationSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters.'),
});

type CustomMeditationState = {
  result?: TextToSpeechOutput;
  error?: string;
  prompt?: string;
};

export async function getCustomMeditationAudio(
  prevState: CustomMeditationState,
  formData: FormData
): Promise<CustomMeditationState> {
  const validatedFields = customMeditationSchema.safeParse({
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.prompt?.join(', '),
    };
  }

  try {
    // 1. Generate the script from the prompt
    const scriptResult = await generateMeditationScript({
      prompt: validatedFields.data.prompt,
    });

    // 2. Convert the generated script to speech
    const audioResult = await textToSpeech(scriptResult.script);
    
    return { result: audioResult, prompt: validatedFields.data.prompt };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate custom meditation.' };
  }
}
