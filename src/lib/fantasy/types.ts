import { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================================================
// FANTASY GAME TYPES
// ============================================================================

export type FantasyCategory = 
  | 'price-prediction'
  | 'trend-fashion'
  | 'celebrity-viral'
  | 'daily-grocery';

export type FantasyGameType =
  // Price Prediction (5 games)
  | 'gold-ornament-price'
  | 'silk-saree-price'
  | 'makeup-beauty-price'
  | 'vegetable-price'
  | 'fruit-price'
  // Trend & Fashion (4 games)
  | 'saree-color-trend'
  | 'jewelry-design-trend'
  | 'bridal-makeup-trend'
  | 'actress-fashion-trend'
  // Celebrity & Viral (2 games)
  | 'celebrity-saree-look'
  | 'viral-fashion-look'
  // Daily Grocery Staples (1 game)
  | 'daily-grocery-price';

export type PredictionType = 'up-down' | 'range' | 'multiple-choice' | 'image-weight' | 'image-wastage' | 'image-making-charges' | 'image-price';

export type GameStatus = 'draft' | 'active' | 'closed' | 'results-declared';

// ============================================================================
// FANTASY GAME SCHEMA
// ============================================================================

export type FantasyGame = {
  id: string;
  title: string;
  description: string;
  category: FantasyCategory;
  gameType: FantasyGameType;
  status: GameStatus;
  
  // Timing
  startTime: Timestamp | FieldValue;
  endTime: Timestamp | FieldValue; // Prediction deadline
  resultRevealTime: Timestamp | FieldValue;
  
  // Entry
  entryCoins: number; // Coins required to participate
  maxParticipants?: number; // Optional limit
  
  // Metadata
  imageUrl?: string;
  tags: string[];
  createdBy: string; // Admin user ID
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // Sponsorship
  mainSponsorId?: string; // Overall game sponsor (from sponsors collection)
  
  // Stats
  totalParticipants: number;
  totalPredictions: number;
};

// ============================================================================
// FANTASY QUESTION SCHEMA
// ============================================================================

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionSource = 'market' | 'trend' | 'celebrity' | 'admin' | 'system';

export type FantasyQuestion = {
  id: string;
  gameId: string;
  question: string;
  predictionType: PredictionType;
  
  // Image-based questions
  imageUrl?: string; // Image for image-based prediction questions
  imageDescription?: string; // Description of the image (e.g., "Gold Chain Ornament")
  
  // Options for multiple choice
  options?: string[];
  
  // Range for range predictions
  minValue?: number;
  maxValue?: number;
  unit?: string; // e.g., "₹", "%", "kg", "grams"
  
  // Correct answer (set by admin after result reveal)
  correctAnswer?: string | number;
  correctRange?: { min: number; max: number };
  
  // Scoring weights
  exactMatchPoints: number;
  nearRangePoints?: number; // Partial points for close predictions
  nearRangeTolerance?: number; // Percentage or absolute value
  
  // Event sponsorship
  eventSponsorId?: string; // Event-specific sponsor (from sponsors collection)
  
  // Order in game (event number) - optional for pool questions
  order?: number;
  
  // Question pool & rotation fields
  difficulty?: QuestionDifficulty; // easy | medium | hard
  tags?: string[]; // daily, seasonal, wedding, festival, trending, etc.
  source: QuestionSource; // market | trend | celebrity | admin | system
  isActive: boolean; // Whether question is available for selection
  createdBy: 'system' | string; // 'system' for auto-generated, userId for admin-created
  
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
};

// ============================================================================
// FANTASY EVENT SCHEMA
// ============================================================================

export type FantasyEvent = {
  id: string;
  name: string;
  gameId: string; // Which game this event belongs to
  description?: string;
  
  // Timing
  startTime: Timestamp | FieldValue;
  endTime: Timestamp | FieldValue;
  
  // Questions assigned to this event
  questionIds: string[]; // References to fantasy_questions
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: string; // Admin user ID
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
};

// ============================================================================
// USER PREDICTION SCHEMA
// ============================================================================

export type UserPrediction = {
  id: string;
  gameId: string;
  questionId: string;
  userId: string;
  
  // Prediction value
  prediction: string | number; // Selected option or value
  
  // Range prediction (if applicable)
  rangeMin?: number;
  rangeMax?: number;
  
  // Metadata
  submittedAt: Timestamp | FieldValue;
  
  // Scoring (calculated after results)
  pointsEarned?: number;
  isCorrect?: boolean;
  scoredAt?: Timestamp | FieldValue;
};

// ============================================================================
// FANTASY RESULT SCHEMA
// ============================================================================

export type FantasyResult = {
  id: string;
  gameId: string;
  questionId: string;
  
  // Result data
  result: string | number;
  resultRange?: { min: number; max: number };
  resultSource?: string; // e.g., "API", "Manual", "Market Data"
  resultUrl?: string; // Link to source
  
  // Declared by
  declaredBy: string; // Admin user ID
  declaredAt: Timestamp | FieldValue;
  
  // Notes
  notes?: string;
};

// ============================================================================
// USER WALLET (COINS) SCHEMA
// ============================================================================

export type CoinTransactionType = 
  | 'daily-login'
  | 'blog-read'
  | 'reel-watch'
  | 'quiz-complete'
  | 'referral'
  | 'fantasy-entry'
  | 'fantasy-win'
  | 'fantasy-bonus'
  | 'admin-grant'
  | 'admin-deduct';

export type CoinTransaction = {
  id: string;
  userId: string;
  type: CoinTransactionType;
  amount: number; // Positive for credit, negative for debit
  description: string;
  metadata?: {
    gameId?: string;
    blogId?: string;
    reelId?: string;
    quizId?: string;
    referralUserId?: string;
  };
  createdAt: Timestamp | FieldValue;
};

export type UserWallet = {
  id: string; // Same as userId
  userId: string;
  balance: number; // Current coin balance
  totalEarned: number; // Lifetime coins earned
  totalSpent: number; // Lifetime coins spent
  lastUpdated: Timestamp | FieldValue;
};

// ============================================================================
// USER BADGE SCHEMA
// ============================================================================

export type BadgeType =
  | 'gold-queen'
  | 'saree-sensei'
  | 'budget-boss'
  | 'trend-setter'
  | 'prediction-master'
  | 'fantasy-champion'
  | 'early-bird'
  | 'streak-keeper';

export type UserBadge = {
  id: string;
  userId: string;
  badgeType: BadgeType;
  badgeName: string;
  badgeDescription: string;
  badgeIcon?: string;
  earnedAt: Timestamp | FieldValue;
  gameId?: string; // If earned from specific game
  metadata?: Record<string, any>;
};

// ============================================================================
// LEADERBOARD SCHEMA
// ============================================================================

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  userAvatar: string;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number; // Percentage
  rank: number;
  badges: BadgeType[];
  lastUpdated: Timestamp | FieldValue;
};

export type Leaderboard = {
  id: string;
  period: LeaderboardPeriod;
  gameType?: FantasyGameType; // Optional: specific game type leaderboard
  category?: FantasyCategory; // Optional: category-specific leaderboard
  entries: LeaderboardEntry[];
  generatedAt: Timestamp | FieldValue;
  validUntil: Timestamp | FieldValue;
};

// ============================================================================
// GAME CONFIGURATION (For Admin)
// ============================================================================

export type GameConfiguration = {
  gameType: FantasyGameType;
  defaultEntryCoins: number;
  defaultExactMatchPoints: number;
  defaultNearRangePoints?: number;
  defaultNearRangeTolerance?: number;
  allowedPredictionTypes: PredictionType[];
  requiresRange?: boolean;
  requiresOptions?: boolean;
  minOptions?: number;
  maxOptions?: number;
};

