# Naari Fantasy Zone - Implementation Guide

## Overview

The Naari Fantasy Zone is a skill-based prediction game system designed for women, focusing on culturally relevant topics like gold prices, saree trends, budget predictions, and celebrity fashion.

## Architecture

### Core Components

1. **Data Models** (`types.ts`)
   - `FantasyGame`: Game configuration and metadata
   - `FantasyQuestion`: Prediction questions with scoring rules
   - `UserPrediction`: User's predictions
   - `FantasyResult`: Declared results
   - `UserWallet`: Coin balance and transactions
   - `UserBadge`: Achievement badges
   - `Leaderboard`: Rankings and statistics

2. **Fantasy Engine** (`engine.ts`)
   - `FantasyScoringEngine`: Calculates points based on predictions
   - `FantasyValidationEngine`: Validates participation and predictions
   - `FantasyGameUtils`: Utility functions for game management
   - `GAME_CONFIGURATIONS`: Pre-configured game types

3. **Firebase Services** (`services.ts`)
   - CRUD operations for all fantasy collections
   - Wallet and transaction management
   - Leaderboard generation

4. **Constants** (`constants.ts`)
   - Badge definitions
   - Coin reward amounts
   - Leaderboard configuration
   - Legal disclaimers

## Implementation Phases

### ✅ Phase 1: Core Infrastructure (COMPLETED)

- [x] Data models and TypeScript types
- [x] Fantasy engine with scoring and validation
- [x] Firebase service functions
- [x] Firestore security rules
- [x] Basic UI structure (Lobby and Game Detail pages)
- [x] Navigation integration

### 🔄 Phase 2: Price Prediction Games (NEXT)

- [ ] Prediction UI components
  - Up/Down selector
  - Range input
  - Multiple choice selector
- [ ] Entry flow (coin deduction)
- [ ] First game type: Gold Ornament Price
- [ ] Second game type: Silk Saree Price
- [ ] Third game type: Makeup & Beauty Price

### 📋 Phase 3: Scoring & Rewards

- [ ] Result declaration system
- [ ] Automatic scoring calculation
- [ ] Badge awarding logic
- [ ] Leaderboard generation
- [ ] Coin rewards distribution

### 🛠️ Phase 4: Admin Panel

- [ ] Game creation interface
- [ ] Question management
- [ ] Result declaration UI
- [ ] Scoring adjustment tools
- [ ] Badge management
- [ ] Analytics dashboard

### 💰 Phase 5: Coin System Integration

- [ ] Daily login rewards
- [ ] Blog reading rewards
- [ ] Reel watching rewards
- [ ] Quiz completion rewards
- [ ] Referral system
- [ ] Transaction history UI

### 🎨 Phase 6: Remaining Categories

- [ ] Lifestyle & Budget games
- [ ] Fashion & Trend games
- [ ] Celebrity & Style games
- [ ] Category-specific UI enhancements

## File Structure

```
src/
├── lib/
│   └── fantasy/
│       ├── types.ts          # TypeScript type definitions
│       ├── engine.ts         # Core game logic
│       ├── services.ts       # Firebase CRUD operations
│       ├── constants.ts      # Badges, rewards, configs
│       ├── index.ts          # Main exports
│       └── README.md         # This file
├── app/
│   └── dashboard/
│       └── fantasy/
│           ├── page.tsx                    # Fantasy Lobby
│           └── [id]/
│               ├── page.tsx                # Game detail route
│               └── fantasy-game-client.tsx  # Game detail component
└── firestore.rules                         # Security rules (updated)
```

## Usage Examples

### Creating a Game (Admin)

```typescript
import { createFantasyGame } from '@/lib/fantasy/services';
import { serverTimestamp } from 'firebase/firestore';

const game = await createFantasyGame(firestore, {
  title: 'Gold Price Prediction',
  description: 'Predict tomorrow\'s gold price',
  category: 'price-prediction',
  gameType: 'gold-ornament-price',
  status: 'active',
  startTime: serverTimestamp(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  resultRevealTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // 26 hours
  entryCoins: 10,
  tags: ['gold', 'price', 'prediction'],
  createdBy: adminUserId,
});
```

### Making a Prediction

```typescript
import { createUserPrediction, addCoinTransaction } from '@/lib/fantasy/services';
import { COIN_REWARDS } from '@/lib/fantasy/constants';

// Deduct entry coins
await addCoinTransaction(firestore, {
  userId: user.uid,
  type: 'fantasy-entry',
  amount: -game.entryCoins,
  description: `Entry fee for ${game.title}`,
  metadata: { gameId: game.id },
});

// Create prediction
await createUserPrediction(firestore, {
  gameId: game.id,
  questionId: question.id,
  userId: user.uid,
  prediction: 'up', // or number, or option string
});
```

### Calculating Scores

```typescript
import { FantasyScoringEngine } from '@/lib/fantasy/engine';

const points = FantasyScoringEngine.calculatePoints(
  userPrediction,
  question,
  result
);
```

## Security Rules

All fantasy collections have appropriate security rules:
- Users can read active games
- Users can create their own predictions
- Only admins can create games and declare results
- Wallet operations are protected
- Transactions are immutable

## Legal Compliance

- ✅ No real money betting
- ✅ Skill-based predictions only
- ✅ Clear disclaimers
- ✅ Transparent scoring rules
- ✅ No cash withdrawal

## Next Steps

1. **Implement Prediction UI** - Build the forms for different prediction types
2. **Add Entry Flow** - Integrate coin deduction and validation
3. **Create First Game** - Set up a test gold price prediction game
4. **Build Admin Tools** - Enable game creation through UI
5. **Add Scoring** - Implement automatic score calculation after results

## Notes

- All timestamps use Firestore `Timestamp` or `serverTimestamp()`
- Coin transactions are immutable for audit trail
- Badges are awarded automatically based on achievements
- Leaderboards are generated periodically (can be optimized with Cloud Functions)

