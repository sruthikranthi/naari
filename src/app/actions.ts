
'use server';
import {
  aiPoweredChatSafety,
  type AIPoweredChatSafetyOutput,
} from '@/ai/flows/ai-powered-chat-safety';
import { generateMeditationScript } from '@/ai/flows/generate-meditation-script';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { z } from 'zod';

export type { AIPoweredChatSafetyOutput };

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
  language: z.string().optional(),
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
    language: formData.get('language'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Text is required.',
    };
  }

  try {
    const result = await textToSpeech({
        text: validatedFields.data.text,
        language: validatedFields.data.language || 'en-US',
    });
    return { result };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate audio.' };
  }
}

const customMeditationSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters.'),
  language: z.string().optional(),
});

type CustomMeditationState = {
  result?: TextToSpeechOutput;
  error?: string;
  prompt?: string;
};

const languageMap: Record<string, string> = {
    'en-US': 'English',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'kn-IN': 'Kannada',
}

export async function getCustomMeditationAudio(
  prevState: CustomMeditationState,
  formData: FormData
): Promise<CustomMeditationState> {
  // Lazy load AI features
  const meditationFn = await loadAIFeatures();
  const validatedFields = customMeditationSchema.safeParse({
    prompt: formData.get('prompt'),
    language: formData.get('language'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.prompt?.join(', '),
    };
  }
  
  const languageCode = validatedFields.data.language || 'en-US';
  const languageName = languageMap[languageCode] || 'English';

  try {
    // 1. Generate the script from the prompt
    const scriptResult = await generateMeditationScript({
      prompt: validatedFields.data.prompt,
      language: languageName,
    });

    // 2. Convert the generated script to speech
    const audioResult = await textToSpeech({
        text: scriptResult.script,
        language: languageCode,
    });
    
    return { result: audioResult, prompt: validatedFields.data.prompt };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate custom meditation.' };
  }
}
