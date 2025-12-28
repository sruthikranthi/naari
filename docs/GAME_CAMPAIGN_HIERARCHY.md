# 🎯 Game, Campaign, and Events - Complete Hierarchy Explained

## **THE HIERARCHY**

```
Campaign (Optional - Groups Games Together)
  │
  ├── Game 1 (Standalone Prediction Game)
  │   ├── Question/Event 1
  │   ├── Question/Event 2
  │   ├── Question/Event 3
  │   └── ... (up to 18 questions)
  │
  ├── Game 2 (Another Game)
  │   ├── Question/Event 1
  │   └── ...
  │
  └── Game 3 (Another Game)
      └── ...
```

---

## **1. GAME (Fantasy Game) - THE FOUNDATION**

### **What is a Game?**
A **Game** is a standalone prediction game that users can play directly. It's the core entity.

### **What a Game Contains:**
- ✅ **Title & Description** - What the game is about
- ✅ **10-18 Questions/Events** - The actual prediction questions
- ✅ **Timing** - Start time, end time, result reveal time
- ✅ **Entry Coins** - How many coins users need to play
- ✅ **Category** - Price prediction, lifestyle, fashion, etc.
- ✅ **Main Sponsor** (optional) - Overall game sponsor
- ✅ **Banner Image** (optional) - Game image

### **Example:**
```
Game: "Gold Ornament Price Prediction - Tomorrow"
├── Question 1: "Will gold price go up or down?" (Up/Down)
├── Question 2: "What will be the price per gram?" (Range: ₹5,000-₹7,000)
├── Question 3: "Which ornament type will be most popular?" (Multiple Choice)
└── ... (up to 18 questions)
```

### **Key Point:**
**Games MUST have questions to be playable!** Without questions, users can't make predictions.

---

## **2. CAMPAIGN (Fantasy Campaign) - THE WRAPPER**

### **What is a Campaign?**
A **Campaign** is an optional wrapper/container that groups multiple games together. Think of it like a tournament or contest.

### **What a Campaign Contains:**
- ✅ **Title & Description** - Campaign name and details
- ✅ **Links to Games** - References existing games via `gameIds`
- ✅ **Prize Pool** - Prizes for winners
- ✅ **Entry Fee** - Free, paid, or coin-based entry
- ✅ **Sponsor** - Campaign-level sponsor
- ✅ **Banner Image** - Campaign banner
- ✅ **Timing** - Campaign start/end dates

### **What a Campaign Does NOT Contain:**
- ❌ **Questions directly** - Questions come from the linked games
- ❌ **Prediction forms** - Users play the games within the campaign

### **Example:**
```
Campaign: "Weekend Fantasy - Pan India Campaign"
├── Game 1: "Gold Price Prediction"
│   ├── Question 1
│   └── Question 2
├── Game 2: "Saree Price Prediction"
│   ├── Question 1
│   └── Question 2
└── Game 3: "Makeup Price Prediction"
    └── ...
```

### **Key Point:**
**Campaigns are optional!** You can create games without campaigns. Campaigns just group games together for prizes and marketing.

---

## **3. QUESTIONS/EVENTS - THE PREDICTIONS**

### **What is a Question/Event?**
A **Question** (also called "Event") is an individual prediction question within a game. Users answer these to make predictions.

### **What a Question Contains:**
- ✅ **Question Text** - The actual question
- ✅ **Prediction Type** - Up/Down, Range, Multiple Choice, Image-based
- ✅ **Options** (if multiple-choice) - Available choices
- ✅ **Scoring Rules** - Points for correct/exact/near predictions
- ✅ **Image** (optional) - For image-based questions
- ✅ **Sponsor** (optional) - Event-level sponsor

### **Example:**
```
Question 1:
- Text: "Will gold price go up or down tomorrow?"
- Type: Up/Down
- Points: 100 for correct

Question 2:
- Text: "What will be the gold price per gram?"
- Type: Range
- Range: ₹5,000 - ₹7,000
- Points: 150 for exact, 75 for near (5% tolerance)
```

---

## **THE CORRECT WORKFLOW**

### **Option 1: Create Game Only (Simplest)**

1. **Create Game**
   - Go to Admin Panel → Fantasy Zone
   - Click "Create Custom Game" or use "Quick Create"
   - Add game details (title, description, timing)
   - **Add 10-18 questions/events** using "Add Event" button
   - Save game
   - ✅ **Game is ready! Users can play it directly**

### **Option 2: Create Game + Campaign (For Prizes)**

1. **Create Games First**
   - Create Game 1 with questions
   - Create Game 2 with questions
   - Create Game 3 with questions
   - (You can create multiple games)

2. **Create Campaign**
   - Go to Admin Panel → Fantasy Zone
   - Click "Create Campaign"
   - Select the games you created (Game 1, Game 2, Game 3)
   - Add prizes, sponsors, entry fees
   - Save campaign
   - ✅ **Campaign groups games together with prizes**

---

## **COMMON CONFUSIONS - CLARIFIED**

### ❌ **Wrong Understanding:**
"First create Campaign, then Game, then Events"

### ✅ **Correct Understanding:**
"First create Game with Questions, then optionally create Campaign to group games"

### **Why?**
- Games are the core entity - they contain questions
- Campaigns are optional wrappers - they just group games
- You CANNOT create a campaign without games first
- Questions belong to games, not campaigns directly

---

## **HOW TO ADD QUESTIONS TO A GAME**

### **When Creating a New Game:**
1. Use "Create Custom Game" form
2. Fill in game details
3. Click "Add Event" button
4. Fill in question details
5. Repeat for 10-18 questions
6. Save game

### **When Editing an Existing Game:**
1. Go to "All Games" section
2. Click "Edit" on the game
3. Use "Add Question" button (NEW FEATURE!)
4. Fill in question details
5. Save game

---

## **SUMMARY**

### **The Hierarchy:**
```
Game (Required - Contains Questions)
  ├── Question/Event 1
  ├── Question/Event 2
  └── ... (10-18 questions)

Campaign (Optional - Groups Games)
  ├── Links to Game 1
  ├── Links to Game 2
  └── Links to Game 3
```

### **The Workflow:**
1. ✅ **Create Game** with 10-18 questions
2. ✅ **Optionally create Campaign** to group games with prizes
3. ✅ Users play games (directly or through campaign)

### **Key Rules:**
- ✅ Games MUST have questions to be playable
- ✅ Campaigns link to existing games (games must exist first)
- ✅ Questions belong to games, not campaigns
- ✅ You can create games without campaigns
- ✅ Campaigns are for grouping games with prizes

---

## **QUICK REFERENCE**

| Entity | Required? | Contains | Purpose |
|--------|-----------|----------|---------|
| **Game** | ✅ Yes | 10-18 Questions | Core prediction game |
| **Campaign** | ❌ Optional | Links to Games | Group games with prizes |
| **Question/Event** | ✅ Yes (in Game) | Prediction details | Individual predictions |

---

**Remember: Game → Questions → (Optional) Campaign**

