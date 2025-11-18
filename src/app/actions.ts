'use server';
import {
  aiPoweredChatSafety,
  type AIPoweredChatSafetyOutput,
} from '@/ai/flows/ai-powered-chat-safety';
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
