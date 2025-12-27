import { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================================================
// FANTASY CAMPAIGN TYPES
// ============================================================================

export type CampaignType = 
  | 'single-game'      // Campaign for a single fantasy game
  | 'multi-game'       // Campaign spanning multiple games
  | 'category-based'   // Campaign for a category of games
  | 'sponsor-based';   // Campaign sponsored by a brand

export type CampaignStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export type CampaignVisibility = 'public' | 'private' | 'invite-only';

export type EntryType = 'free' | 'paid' | 'coin-based';

export type Currency = 'INR' | 'USD';

export type PrizeTier = {
  rankStart: number;      // e.g., 1
  rankEnd: number;         // e.g., 10
  prize: string;          // e.g., "₹10,000 + 1000 Coins"
  prizeValue?: number;     // Numeric value for calculations
  currency?: Currency;
};

export type FantasyCampaign = {
  id: string;
  title: string;
  campaignType: CampaignType;
  
  // Game association
  gameIds: string[];       // One or more fantasy games
  category?: string;      // If category-based
  
  // Language (for regional campaigns)
  language?: string;      // e.g., "Hindi", "Telugu", "English", "Tamil"
  
  // Description
  description?: string;
  
  // Campaign Image/Banner
  imageUrl?: string;      // Campaign banner/hero image
  
  // Timing
  startDate: Timestamp | FieldValue;
  endDate?: Timestamp | FieldValue;
  
  // Status & Visibility
  status: CampaignStatus;
  visibility: CampaignVisibility;
  
  // Participation
  maxParticipants?: number;
  
  // Sponsorship
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorId?: string;     // Reference to sponsors collection
  
  // Entry & Rewards
  entryType: EntryType;
  entryFee?: number;      // If paid entry
  entryCoins?: number;    // If coin-based entry
  
  // Prize Pool
  prizePool?: string;     // Display text, e.g., "Vouchers & 1,00,000 Coins"
  totalPrizeValue?: number; // Numeric value
  currency: Currency;
  prizeTiers?: PrizeTier[];
  
  // Additional Notes
  notes?: string;
  
  // Events/Questions (can override game questions or add campaign-specific)
  eventIds?: string[];    // References to fantasy_questions
  
  // Metadata
  createdBy: string;      // Admin user ID
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  
  // Stats
  totalParticipants: number;
  totalEntries: number;
};

