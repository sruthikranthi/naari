import type { Timestamp, FieldValue } from 'firebase/firestore';

/** Media type: video (10s) or image (10s) */
export type QuizMediaType = 'video' | 'image';

/** Question type: 4 options or direct text answer */
export type QuizQuestionType = 'multiple_choice' | 'text';

/** Prize type for sponsored quiz */
export type QuizPrizeType = 'money' | 'gift_coupon' | 'rewards' | 'coins';

export type QuizQuestion = {
  questionText: string;
  type: QuizQuestionType;
  /** For multiple_choice: exactly 4 options */
  options?: string[];
  /** For multiple_choice: index 0–3. For text: correct answer string */
  correctAnswer: number | string;
};

export type SponsoredQuiz = {
  id: string;
  title: string;
  description?: string;
  /** video or image */
  mediaType: QuizMediaType;
  /** URL of video or image (Firebase Storage or external) */
  mediaUrl: string;
  /** Display duration in seconds (e.g. 10) */
  mediaDurationSeconds: number;
  /** Sponsor logo/image URL */
  sponsorImageUrl: string;
  /** Sponsor brand name to display */
  sponsorBrandName: string;
  /** Max participants allowed (0 = unlimited) */
  maxParticipants: number;
  /** Current participant count (denormalized for display) */
  participantCount: number;
  /** Prize type */
  prizeType: QuizPrizeType;
  /** e.g. "500", "Amazon ₹500", "50" (coins) */
  prizeValue: string;
  /** Exactly 5 questions */
  questions: QuizQuestion[];
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  userId: string;
  /** Answers: for MC, option index; for text, answer string */
  answers: (number | string)[];
  /** Number of correct answers (0–5) */
  score: number;
  completedAt: Timestamp | FieldValue;
  /** Whether completion coins were awarded */
  coinsAwarded: boolean;
};
