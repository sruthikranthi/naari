# 🎯 Question & Event Generation System - Implementation Phases

## **📋 TOTAL PHASES: 6**

---

## **✅ PHASE 1: Update Data Models**
**Status:** In Progress

### Tasks:
1. ✅ Extend `FantasyQuestion` schema with:
   - `difficulty`: 'easy' | 'medium' | 'hard'
   - `tags`: string[] (daily, seasonal, wedding, festival, trending)
   - `source`: 'market' | 'trend' | 'celebrity' | 'admin'
   - `isActive`: boolean
   - `createdBy`: 'system' | string (admin userId)

2. ✅ Create new `FantasyEvent` schema:
   - id, name, gameId, description
   - startTime, endTime
   - questionIds[]
   - isActive
   - createdBy, createdAt, updatedAt

3. ✅ Update TypeScript types

---

## **⏳ PHASE 2: Question Generation Seed Script**
**Status:** Pending

### Tasks:
1. Create seed script to generate 30-50 questions per game
2. Generate questions for all 12 games (360-600 total)
3. Include all question types:
   - Range-based price questions
   - Comparison questions (This vs That)
   - Trend prediction questions
   - Viral/popularity questions
4. Mark all as `createdBy: 'system'`
5. Add appropriate tags and difficulty levels

---

## **⏳ PHASE 3: Question Rotation & Selection Logic**
**Status:** Pending

### Tasks:
1. Create function to randomly select 2-3 questions per game session
2. Filter by:
   - `isActive = true`
   - Matching tags (daily/seasonal if applicable)
   - Game type compatibility
3. Implement smart defaults for question selection
4. Support event-based question filtering

---

## **⏳ PHASE 4: Event CRUD Services & APIs**
**Status:** Pending

### Tasks:
1. Create Event services:
   - `createFantasyEvent()`
   - `getFantasyEvent()`
   - `getActiveEvents()`
   - `updateFantasyEvent()`
   - `deleteFantasyEvent()`
2. Create API routes for events
3. Link questions to events via `questionIds[]`

---

## **⏳ PHASE 5: Admin UI for Question & Event Management**
**Status:** Pending

### Tasks:
1. Create admin UI for:
   - Viewing all questions (filtered by game)
   - Creating new questions manually
   - Editing existing questions
   - Activating/deactivating questions
   - Assigning questions to events
2. Create admin UI for:
   - Creating events
   - Managing event questions
   - Setting event timing
3. Add question pool viewer

---

## **⏳ PHASE 6: Update Game Creation to Use Question Pool**
**Status:** Pending

### Tasks:
1. Update game creation flow to:
   - Select questions from pool instead of creating new ones
   - Support random selection on game creation
   - Allow admin override for specific questions
2. Update Quick Create games to use question pool
3. Ensure backward compatibility

---

## **📊 Progress Summary**

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Data Models | 🟡 In Progress | 0% |
| Phase 2: Seed Script | ⚪ Pending | 0% |
| Phase 3: Rotation Logic | ⚪ Pending | 0% |
| Phase 4: Event APIs | ⚪ Pending | 0% |
| Phase 5: Admin UI | ⚪ Pending | 0% |
| Phase 6: Integration | ⚪ Pending | 0% |

---

**Total Estimated Questions:** 360-600 questions (30-50 per game × 12 games)

