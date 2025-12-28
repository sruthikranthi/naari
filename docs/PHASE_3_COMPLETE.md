# ✅ Phase 3 Complete: Question Rotation & Selection Logic

## **Summary**

Phase 3 implements intelligent question selection from the question pool, supporting filtering, rotation, and event-based selection.

---

## **✅ What's Been Completed**

### **1. Question Selection Engine** ✅
- Created `src/lib/fantasy/question-selector.ts`
- Main function: `selectQuestionsForGame()` - Selects 2-3 questions per game session
- Supports filtering by:
  - `isActive = true`
  - Tags (daily, seasonal, wedding, festival, trending)
  - Difficulty (easy, medium, hard)
  - Source (market, trend, celebrity, admin, system)
  - Event ID (event-based questions)

### **2. Selection Functions** ✅

#### **`selectQuestionsForGame()`** - Main selector
- Randomly selects questions from pool
- Filters by active status, tags, difficulty, source
- Supports event-based filtering
- Prioritizes seasonal questions based on current date
- Excludes specified question IDs (avoid duplicates)

#### **`selectBalancedQuestions()`** - Balanced difficulty
- Selects mix of easy (40%), medium (40%), hard (20%)
- Ensures variety in question difficulty
- Falls back to available questions if needed

#### **`selectDailyQuestions()`** - Daily rotation
- Prioritizes questions tagged with 'daily'
- No seasonal prioritization
- Good for daily game sessions

#### **`selectWeeklyQuestions()`** - Weekly rotation
- Uses week number as seed for consistent rotation
- Same questions for same week (reproducible)
- Good for weekly game cycles

#### **`selectEventQuestions()`** - Event-based
- Selects questions from a specific event
- Used for limited-time events (e.g., "Diwali Special")

### **3. Smart Features** ✅

#### **Seasonal Prioritization**
- Automatically detects current season/period:
  - Wedding season: Nov-Feb
  - Festival season: Sep-Nov (Diwali, etc.)
- Prioritizes seasonal questions when available
- Mixes 50% seasonal + 50% regular questions

#### **Reproducible Shuffling**
- Supports seed-based shuffling for consistent results
- Weekly rotation uses week number as seed
- Same seed = same question order

#### **Question Availability Check**
- `getAvailableQuestionCount()` - Check how many questions are available
- Useful for validation before game creation

---

## **📋 Usage Examples**

### **Basic Selection (2-3 random questions)**
```typescript
import { selectQuestionsForGame } from '@/lib/fantasy/question-selector';

const questions = await selectQuestionsForGame(firestore, gameId);
// Returns 2-3 random active questions
```

### **Select with Tags (Daily questions)**
```typescript
const questions = await selectQuestionsForGame(firestore, gameId, {
  tags: ['daily'],
  count: 3,
});
```

### **Select Balanced Difficulty**
```typescript
import { selectBalancedQuestions } from '@/lib/fantasy/question-selector';

const questions = await selectBalancedQuestions(firestore, gameId, {
  count: 3,
  difficulties: ['easy', 'medium', 'hard'],
});
```

### **Select for Event**
```typescript
import { selectEventQuestions } from '@/lib/fantasy/question-selector';

const questions = await selectEventQuestions(
  firestore,
  gameId,
  eventId,
  { count: 3 }
);
```

### **Weekly Rotation**
```typescript
import { selectWeeklyQuestions } from '@/lib/fantasy/question-selector';

const questions = await selectWeeklyQuestions(firestore, gameId, {
  count: 3,
  tags: ['daily'],
});
```

### **Check Available Questions**
```typescript
import { getAvailableQuestionCount } from '@/lib/fantasy/question-selector';

const count = await getAvailableQuestionCount(firestore, gameId, {
  tags: ['daily'],
  difficulty: 'medium',
});

if (count < 3) {
  console.warn('Not enough questions available');
}
```

---

## **🎯 Selection Options**

```typescript
type QuestionSelectionOptions = {
  count?: number;              // Number to select (default: 3)
  minCount?: number;           // Minimum required (default: 2)
  difficulties?: QuestionDifficulty[];  // Filter by difficulty
  tags?: string[];             // Filter by tags
  source?: string;             // Filter by source
  eventId?: string;            // Select from event
  prioritizeSeasonal?: boolean; // Auto-prioritize seasonal (default: true)
  excludeQuestionIds?: string[]; // Exclude these IDs
  seed?: number;               // Random seed for reproducibility
};
```

---

## **🔄 Integration Points**

### **Game Creation Flow**
When creating a new game, use question selector to pick questions:

```typescript
// In game creation
const selectedQuestions = await selectQuestionsForGame(firestore, gameId, {
  count: 3,
  tags: ['daily'],
});

// Assign to game (set order)
selectedQuestions.forEach((q, index) => {
  await updateFantasyQuestion(firestore, q.id, { order: index + 1 });
});
```

### **Event-Based Games**
For limited-time events:

```typescript
// Create event with specific questions
const eventId = await createFantasyEvent(firestore, {
  name: 'Diwali Special',
  gameId,
  questionIds: [...],
  startTime,
  endTime,
  isActive: true,
});

// Select questions from event
const questions = await selectEventQuestions(firestore, gameId, eventId);
```

---

## **✅ Features**

- ✅ Random selection with filtering
- ✅ Seasonal prioritization
- ✅ Balanced difficulty distribution
- ✅ Event-based selection
- ✅ Daily/weekly rotation
- ✅ Reproducible shuffling (seed support)
- ✅ Question availability checking
- ✅ Exclude duplicates
- ✅ Tag-based filtering
- ✅ Source-based filtering

---

## **📊 Progress**

- **Phase 1:** ✅ Data Models - Complete
- **Phase 2:** ✅ Seed Script - Complete (3/12 games)
- **Phase 3:** ✅ Question Selection - Complete
- **Phase 4:** ⏳ Event CRUD Services - Pending
- **Phase 5:** ⏳ Admin UI - Pending
- **Phase 6:** ⏳ Game Creation Integration - Pending

---

**Next Phase:** Phase 4 - Create Event CRUD Services & APIs

