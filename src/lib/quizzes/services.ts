/**
 * Sponsored Quizzes - Firestore services
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  type Firestore,
} from 'firebase/firestore';
import type { SponsoredQuiz, QuizAttempt, QuizQuestion } from './types';
import { awardQuizCompleteCoins } from '@/lib/fantasy/coin-rewards';

const QUIZZES_COLLECTION = 'sponsored_quizzes';
const ATTEMPTS_COLLECTION = 'quiz_attempts';

function toQuiz(data: Record<string, unknown>, id: string): SponsoredQuiz {
  return {
    id,
    title: (data.title as string) ?? '',
    description: data.description as string | undefined,
    mediaType: (data.mediaType as SponsoredQuiz['mediaType']) ?? 'image',
    mediaUrl: (data.mediaUrl as string) ?? '',
    mediaDurationSeconds: (data.mediaDurationSeconds as number) ?? 10,
    sponsorImageUrl: (data.sponsorImageUrl as string) ?? '',
    sponsorBrandName: (data.sponsorBrandName as string) ?? '',
    maxParticipants: (data.maxParticipants as number) ?? 0,
    participantCount: (data.participantCount as number) ?? 0,
    prizeType: (data.prizeType as SponsoredQuiz['prizeType']) ?? 'coins',
    prizeValue: (data.prizeValue as string) ?? '',
    questions: (data.questions as QuizQuestion[]) ?? [],
    isActive: (data.isActive as boolean) ?? true,
    createdBy: (data.createdBy as string) ?? '',
    createdAt: data.createdAt as SponsoredQuiz['createdAt'],
    updatedAt: data.updatedAt as SponsoredQuiz['updatedAt'],
  };
}

function toAttempt(data: Record<string, unknown>, id: string): QuizAttempt {
  return {
    id,
    quizId: (data.quizId as string) ?? '',
    userId: (data.userId as string) ?? '',
    answers: (data.answers as (number | string)[]) ?? [],
    score: (data.score as number) ?? 0,
    completedAt: data.completedAt as QuizAttempt['completedAt'],
    coinsAwarded: (data.coinsAwarded as boolean) ?? false,
  };
}

export async function getSponsoredQuiz(
  firestore: Firestore,
  quizId: string
): Promise<SponsoredQuiz | null> {
  const snap = await getDoc(doc(firestore, QUIZZES_COLLECTION, quizId));
  if (!snap.exists()) return null;
  return toQuiz(snap.data() as Record<string, unknown>, snap.id);
}

export async function getActiveSponsoredQuizzes(
  firestore: Firestore
): Promise<SponsoredQuiz[]> {
  const q = query(
    collection(firestore, QUIZZES_COLLECTION),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toQuiz(d.data() as Record<string, unknown>, d.id));
}

export async function getAllSponsoredQuizzes(
  firestore: Firestore
): Promise<SponsoredQuiz[]> {
  const q = query(
    collection(firestore, QUIZZES_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toQuiz(d.data() as Record<string, unknown>, d.id));
}

export async function createSponsoredQuiz(
  firestore: Firestore,
  quiz: Omit<SponsoredQuiz, 'id' | 'participantCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const data: Record<string, unknown> = {
    title: quiz.title,
    description: quiz.description ?? null,
    mediaType: quiz.mediaType,
    mediaUrl: quiz.mediaUrl,
    mediaDurationSeconds: quiz.mediaDurationSeconds ?? 10,
    sponsorImageUrl: quiz.sponsorImageUrl,
    sponsorBrandName: quiz.sponsorBrandName,
    maxParticipants: quiz.maxParticipants ?? 0,
    participantCount: 0,
    prizeType: quiz.prizeType,
    prizeValue: quiz.prizeValue,
    questions: quiz.questions,
    isActive: quiz.isActive ?? true,
    createdBy: quiz.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(firestore, QUIZZES_COLLECTION), data);
  return ref.id;
}

export async function updateSponsoredQuiz(
  firestore: Firestore,
  quizId: string,
  updates: Partial<Omit<SponsoredQuiz, 'id' | 'createdAt' | 'participantCount'>>
): Promise<void> {
  const { participantCount: _pc, createdAt: _ca, ...rest } = updates as Partial<SponsoredQuiz> & { participantCount?: number; createdAt?: unknown };
  const data = {
    ...rest,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(doc(firestore, QUIZZES_COLLECTION, quizId), data);
}

export async function deleteSponsoredQuiz(
  firestore: Firestore,
  quizId: string
): Promise<void> {
  await deleteDoc(doc(firestore, QUIZZES_COLLECTION, quizId));
}

export async function getQuizAttempt(
  firestore: Firestore,
  quizId: string,
  userId: string
): Promise<QuizAttempt | null> {
  const q = query(
    collection(firestore, ATTEMPTS_COLLECTION),
    where('quizId', '==', quizId),
    where('userId', '==', userId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return toAttempt(d.data() as Record<string, unknown>, d.id);
}

export async function getAttemptsForQuiz(
  firestore: Firestore,
  quizId: string
): Promise<QuizAttempt[]> {
  const q = query(
    collection(firestore, ATTEMPTS_COLLECTION),
    where('quizId', '==', quizId),
    orderBy('completedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toAttempt(d.data() as Record<string, unknown>, d.id));
}

function normalizeTextAnswer(s: string): string {
  return String(s ?? '').trim().toLowerCase();
}

function isCorrectAnswer(question: QuizQuestion, userAnswer: number | string): boolean {
  if (question.type === 'multiple_choice') {
    return Number(userAnswer) === Number(question.correctAnswer);
  }
  return normalizeTextAnswer(String(userAnswer)) === normalizeTextAnswer(String(question.correctAnswer));
}

export async function submitQuizAttempt(
  firestore: Firestore,
  quizId: string,
  userId: string,
  answers: (number | string)[]
): Promise<{ attemptId: string; score: number; coinsAwarded: number }> {
  const quiz = await getSponsoredQuiz(firestore, quizId);
  if (!quiz) throw new Error('Quiz not found');
  if (!quiz.isActive) throw new Error('Quiz is not active');

  const existing = await getQuizAttempt(firestore, quizId, userId);
  if (existing) throw new Error('You have already attempted this quiz.');

  if (quiz.maxParticipants > 0 && quiz.participantCount >= quiz.maxParticipants) {
    throw new Error('Maximum participants reached.');
  }

  if (answers.length !== quiz.questions.length) {
    throw new Error('Please answer all questions.');
  }

  let score = 0;
  for (let i = 0; i < quiz.questions.length; i++) {
    if (isCorrectAnswer(quiz.questions[i], answers[i])) score++;
  }

  const attemptData: Omit<QuizAttempt, 'id' | 'completedAt'> = {
    quizId,
    userId,
    answers,
    score,
    coinsAwarded: false,
  };

  const attemptRef = await addDoc(collection(firestore, ATTEMPTS_COLLECTION), {
    ...attemptData,
    completedAt: serverTimestamp(),
  });

  await updateDoc(doc(firestore, QUIZZES_COLLECTION, quizId), {
    participantCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  const coinResult = await awardQuizCompleteCoins(
    firestore,
    userId,
    quizId,
    quiz.title,
    Math.round((score / quiz.questions.length) * 100)
  );

  if (coinResult.awarded) {
    await updateDoc(attemptRef, { coinsAwarded: true });
  }

  return {
    attemptId: attemptRef.id,
    score,
    coinsAwarded: coinResult.awarded ? coinResult.coins : 0,
  };
}
