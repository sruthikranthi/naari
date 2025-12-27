import { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================================================
// AD & SPONSORSHIP TYPES
// ============================================================================

export type AdCampaignType = 'OVERALL' | 'EVENT' | 'IMAGE';

export type AdPosition = 
  | 'PRE_GAME'
  | 'MID_GAME'
  | 'POST_GAME'
  | 'INTER_EVENT'
  | 'LOBBY_BANNER'
  | 'LEADERBOARD_BANNER'
  | 'PROFILE_BANNER';

export type FrequencyType = 
  | 'ONCE_PER_SESSION'
  | 'AFTER_N_PREDICTIONS'
  | 'AFTER_N_GAMES'
  | 'ONCE_PER_DAY'
  | 'CAMPAIGN_DATES_ONLY';

export type SponsorshipType = 'OVERALL' | 'EVENT';

export type TargetingRule = {
  locations?: string[]; // e.g., ['IN', 'US', 'UK']
  languages?: string[]; // e.g., ['en', 'hi', 'te']
  interests?: string[]; // e.g., ['fashion', 'beauty', 'jewelry']
  gameCategories?: string[]; // e.g., ['price-prediction', 'fashion-trend']
  minCoins?: number; // Target users with minimum coin balance
  userSegments?: string[]; // e.g., ['active', 'new', 'premium']
};

export type ABTestVariant = {
  id: string;
  creativeId: string;
  weight: number; // 0-100, percentage of traffic
  performance?: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
};

export type RotationStrategy = 'ROUND_ROBIN' | 'WEIGHTED' | 'PERFORMANCE_BASED' | 'RANDOM' | 'ML_OPTIMIZED';

export type ConversionEvent = {
  id: string;
  adId: string;
  campaignId: string;
  userId: string;
  eventType: 'PURCHASE' | 'SIGNUP' | 'DOWNLOAD' | 'CLICK_THROUGH' | 'VIEW' | 'ENGAGEMENT';
  value?: number; // Monetary value for purchase events
  timestamp: Timestamp | FieldValue;
  metadata?: Record<string, any>;
};

export type RealTimeCTR = {
  creativeId: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  lastUpdated: Timestamp | FieldValue;
  // Performance score for ML
  performanceScore: number;
};

export type MLModelConfig = {
  enabled: boolean;
  modelType: 'THOMPSON_SAMPLING' | 'UCB' | 'EPSILON_GREEDY' | 'LINEAR_REGRESSION';
  explorationRate?: number; // For epsilon-greedy
  confidenceLevel?: number; // For UCB
  updateInterval?: number; // Minutes between model updates
};

// ============================================================================
// AD CAMPAIGN SCHEMA
// ============================================================================

export type AdCampaign = {
  id: string;
  name: string;
  brandName: string;
  type: AdCampaignType;
  startDate: Timestamp | FieldValue;
  endDate: Timestamp | FieldValue;
  priority: number; // Higher number = higher priority
  active: boolean;
  createdBy: string; // Admin user ID
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // Metadata
  description?: string;
  targetAudience?: string;
  budget?: number; // Optional: for tracking
  
  // Advanced Features
  targeting?: TargetingRule;
  rotationStrategy?: RotationStrategy;
  abTestEnabled?: boolean;
  revenuePerClick?: number; // Revenue in INR per click
  revenuePerImpression?: number; // Revenue in INR per impression
  
  // ML & Performance
  mlConfig?: MLModelConfig;
  dynamicWeightsEnabled?: boolean;
  minImpressionsForWeightUpdate?: number; // Minimum impressions before adjusting weights
};

// ============================================================================
// AD CREATIVE SCHEMA
// ============================================================================

export type AdCreative = {
  id: string;
  campaignId: string;
  imageUrl: string;
  clickUrl: string;
  aspectRatio?: string; // e.g., "16:9", "1:1", "4:3"
  altText: string;
  title?: string;
  description?: string;
  order: number; // For rotation within campaign
  active: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // A/B Testing
  abTestVariant?: string; // Variant ID for A/B testing
  weight?: number; // Weight for rotation (0-100)
};

// ============================================================================
// AD PLACEMENT RULE SCHEMA
// ============================================================================

export type AdPlacementRule = {
  id: string;
  campaignId: string;
  position: AdPosition;
  frequencyType: FrequencyType;
  frequencyValue?: number; // For AFTER_N_PREDICTIONS, AFTER_N_GAMES
  applicableGames?: string[]; // Game IDs for EVENT type ads
  applicableCategories?: string[]; // Category filters
  active: boolean;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // Advanced Targeting
  targeting?: TargetingRule;
};

// ============================================================================
// SPONSOR SCHEMA
// ============================================================================

export type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  sponsorshipType: SponsorshipType;
  linkedGameIds?: string[]; // For EVENT type sponsors
  active: boolean;
  priority: number;
  startDate?: Timestamp | FieldValue;
  endDate?: Timestamp | FieldValue;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // Metadata
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
};

// ============================================================================
// AD IMPRESSION SCHEMA
// ============================================================================

export type AdImpression = {
  id: string;
  adId: string; // AdCreative ID or Sponsor ID
  campaignId: string;
  userId: string;
  timestamp: Timestamp | FieldValue;
  placement: AdPosition;
  gameId?: string; // If shown in a specific game
  metadata?: Record<string, any>;
};

// ============================================================================
// AD CLICK SCHEMA
// ============================================================================

export type AdClick = {
  id: string;
  adId: string; // AdCreative ID or Sponsor ID
  campaignId: string;
  userId: string;
  timestamp: Timestamp | FieldValue;
  placement: AdPosition;
  gameId?: string; // If clicked from a specific game
  clickUrl: string;
  metadata?: Record<string, any>;
};

// ============================================================================
// AD DECISION RESULT
// ============================================================================

export type AdDecision = {
  show: boolean;
  ad?: AdCreative | Sponsor;
  type?: 'IMAGE' | 'SPONSOR';
  placement: AdPosition;
  reason?: string;
};

