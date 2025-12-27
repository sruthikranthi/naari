# 📸 Image Ads System - Complete Explanation

## Overview
Image Ads are full-screen, modal-based advertisements that appear at strategic points in the user journey. They are designed to be non-intrusive, user-friendly, and fully controlled by admins.

---

## 🎯 **WHERE IMAGE ADS APPEAR**

Image ads can be displayed at **7 different positions** in the application:

### 1. **PRE_GAME** 
- **When**: Before a user enters a fantasy game
- **Location**: Fantasy game detail page, before predictions start
- **Use Case**: Show ads before users start playing

### 2. **MID_GAME**
- **When**: During gameplay (after N predictions)
- **Location**: In the middle of a fantasy game session
- **Use Case**: Show ads after users have made some predictions

### 3. **POST_GAME**
- **When**: After results are revealed
- **Location**: Fantasy game detail page, after results
- **Use Case**: Show ads after users see their results

### 4. **INTER_EVENT**
- **When**: After N events/games played
- **Location**: Between game sessions
- **Use Case**: Show ads after users complete multiple games

### 5. **LOBBY_BANNER**
- **When**: In the fantasy lobby/homepage
- **Location**: Fantasy games listing page
- **Use Case**: Overall platform-level advertising

### 6. **LEADERBOARD_BANNER**
- **When**: On leaderboard pages
- **Location**: Leaderboard views
- **Use Case**: Target engaged, competitive users

### 7. **PROFILE_BANNER**
- **When**: On user profile pages
- **Location**: User profile views
- **Use Case**: Personalized advertising

---

## 🔄 **HOW IMAGE ADS WORK - COMPLETE FLOW**

### **Step 1: Admin Creates Image Ad**
1. Admin goes to **Admin Panel → Ads & Sponsors → Creatives Tab**
2. Clicks **"Create Image Ad"** button
3. Fills out the form:
   - **Title** (required)
   - **Description** (optional)
   - **Ad Image** (upload file or provide URL)
   - **Click-Through URL** (where users go when they click)
   - **Display Duration** (3-30 seconds - how long user must view)
   - **Priority** (1-100, higher = shown first)
   - **Start/End Date** (when ad should be active)
   - **Status** (Active/Inactive)
   - **View Limits** (optional - max total views, max per user)
   - **Repeat Behavior** (how often to show to same user)
   - **Targeting** (optional - which games/campaigns)

4. Ad is saved to Firestore `ad_creatives` collection

### **Step 2: Ad Decision Engine Selects Ad**
When a user reaches a position where an ad might show:

1. **AdDecisionEngine.decideAd()** is called with:
   - Position (e.g., `PRE_GAME`)
   - User ID
   - Game ID (if applicable)
   - User stats (predictions count, games played, etc.)

2. **Priority System** (in order):
   ```
   Priority 1: Overall Campaign Sponsors (for banners)
   Priority 2: Event/Game Level Sponsors (for game-specific)
   Priority 3: Image Ads (with placement rules)
   ```

3. **Image Ad Selection Process**:
   - Fetches all active image campaigns
   - Checks placement rules for the position
   - Validates frequency rules (e.g., "show once per day")
   - Checks targeting rules (location, language, interests)
   - Applies rotation strategy (Round Robin, Weighted, Performance-Based, ML-Optimized)
   - Selects the best ad creative

4. **Frequency Checks**:
   - `ONCE_PER_SESSION`: Show only once per browser session
   - `AFTER_N_PREDICTIONS`: Show after user makes N predictions
   - `AFTER_N_GAMES`: Show after user plays N games
   - `ONCE_PER_DAY`: Show maximum once per day per user
   - `CAMPAIGN_DATES_ONLY`: Only show during campaign dates

5. **View Limits**:
   - Checks if ad has reached `maxViews` (total)
   - Checks if user has reached `maxViewsPerUser`
   - Checks `repeatInterval` (NEVER, DAILY, WEEKLY, MONTHLY, ALWAYS)
   - Checks `minTimeBetweenViews` (minimum seconds between views)

### **Step 3: Ad Modal Displays**
If an ad is selected:

1. **ImageAdModal** component opens as a full-screen dialog
2. Shows:
   - Ad image (full width, aspect ratio maintained)
   - "Sponsored" label
   - Ad title and description (if provided)
   - "Learn More" button
   - Close button (X) in top-right

3. **User Must View for Display Duration**:
   - Ad must be visible for the specified duration (3-30 seconds)
   - User can close after minimum duration

4. **Impression is Recorded**:
   - When ad loads, an impression is recorded in `ad_impressions` collection
   - Tracks: adId, userId, placement, gameId, timestamp

### **Step 4: User Interaction**
When user clicks "Learn More":

1. **Click is Recorded**:
   - Click is recorded in `ad_clicks` collection
   - Tracks: adId, userId, placement, gameId, clickUrl, timestamp

2. **User Redirected**:
   - Opens clickUrl in new tab
   - Uses `window.open()` with security flags (`noopener, noreferrer`)

---

## 📊 **ADMIN CONTROL FEATURES**

### **1. Frequency Control**
Admins can control how often ads show:
- **Once per session**: User sees ad max once per browser session
- **After N predictions**: Show after user makes X predictions
- **After N games**: Show after user plays X games
- **Once per day**: Maximum once per 24 hours
- **Campaign dates only**: Only during specified date range

### **2. View Limits**
- **Max Views (Total)**: Limit total impressions across all users
- **Max Views Per User**: Limit how many times one user can see it
- **Repeat Interval**: Control when to show again (NEVER, DAILY, WEEKLY, MONTHLY, ALWAYS)
- **Min Time Between Views**: Minimum seconds between views (overrides repeat interval)

### **3. Targeting**
- **Target Campaigns**: Show only for specific campaigns
- **Target Games**: Show only for specific fantasy games
- **Location**: Target users by country/region
- **Language**: Target users by language preference
- **Interests**: Target users by interests
- **Coin Balance**: Target users with minimum coin balance
- **User Segments**: Target active, new, or premium users

### **4. Rotation Strategies**
- **ROUND_ROBIN**: Cycle through ads evenly
- **WEIGHTED**: Show ads based on assigned weights
- **PERFORMANCE_BASED**: Show better-performing ads more often
- **RANDOM**: Random selection
- **ML_OPTIMIZED**: Machine learning optimization (Thompson Sampling, UCB, etc.)

### **5. Priority System**
- Ads with higher priority (1-100) are shown first
- Multiple ads can have same priority (then rotation strategy applies)

---

## 🎨 **AD DISPLAY UI**

### **Image Ad Modal Features**:
- ✅ Full-screen modal dialog
- ✅ Responsive design (mobile-friendly)
- ✅ Image preview with proper aspect ratio
- ✅ "Sponsored" label (legal requirement)
- ✅ Close button (always visible)
- ✅ "Learn More" button with external link icon
- ✅ Loading state while ad is being fetched
- ✅ Graceful fallback if no ad available

### **User Experience**:
- Non-intrusive: User can close after minimum duration
- Clear labeling: "Sponsored" text
- Smooth transitions
- No sudden popups (only at designated positions)

---

## 📈 **TRACKING & ANALYTICS**

### **What Gets Tracked**:

1. **Impressions** (`ad_impressions` collection):
   - When ad is shown
   - Which user saw it
   - Which position
   - Which game (if applicable)
   - Timestamp

2. **Clicks** (`ad_clicks` collection):
   - When user clicks "Learn More"
   - Which user clicked
   - Which position
   - Which game (if applicable)
   - Click URL
   - Timestamp

3. **Performance Metrics**:
   - Click-Through Rate (CTR) = Clicks / Impressions
   - Conversion Rate (if conversion tracking enabled)
   - Revenue (if revenue per click/impression set)
   - Real-time CTR tracking (5-minute cache)

### **Admin Analytics Dashboard**:
- View impressions and clicks per ad
- See CTR and conversion rates
- Revenue estimation
- A/B test results
- ML performance metrics

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **Components**:
1. **`ImageAdModal`**: Full-screen modal for displaying image ads
2. **`CreateImageAdForm`**: Admin form for creating image ads
3. **`AdDecisionEngine`**: Core logic for selecting which ad to show
4. **`InlineAdCard`**: Alternative inline ad display (for non-modal positions)

### **Data Collections**:
- `ad_campaigns`: Campaign metadata
- `ad_creatives`: Individual ad creatives (images)
- `ad_placement_rules`: Rules for when/where to show ads
- `ad_impressions`: Track when ads are shown
- `ad_clicks`: Track when users click ads

### **Integration Points**:
- **Fantasy Game Page**: Shows PRE_GAME and POST_GAME ads
- **Fantasy Lobby**: Shows LOBBY_BANNER ads
- **Leaderboard**: Shows LEADERBOARD_BANNER ads
- **User Profile**: Shows PROFILE_BANNER ads

---

## 🎯 **BEST PRACTICES**

### **For Admins**:
1. **Set Appropriate Display Duration**: 5-10 seconds is optimal
2. **Use Targeting**: Target relevant audiences for better engagement
3. **Monitor Performance**: Check CTR and adjust targeting/creative
4. **Respect Frequency Limits**: Don't over-show ads (bad UX)
5. **Test Creatives**: Use A/B testing to find best-performing ads

### **For Users**:
- Ads are clearly labeled as "Sponsored"
- Users can always close ads after minimum duration
- Ads only show at designated, non-intrusive positions
- Frequency limits prevent ad fatigue

---

## 🚀 **EXAMPLE SCENARIOS**

### **Scenario 1: Pre-Game Ad**
1. User clicks on a fantasy game
2. Before game loads, `ImageAdModal` with `position="PRE_GAME"` is triggered
3. AdDecisionEngine finds an active image ad for PRE_GAME position
4. Checks frequency: User hasn't seen this ad today → Show ad
5. Modal displays for 5 seconds (displayDuration)
6. User can close or click "Learn More"
7. Impression recorded, click recorded (if clicked)

### **Scenario 2: Post-Game Ad**
1. User completes a fantasy game and sees results
2. `ImageAdModal` with `position="POST_GAME"` is triggered
3. AdDecisionEngine finds an ad targeting this specific game
4. Checks view limits: User hasn't exceeded maxViewsPerUser → Show ad
5. Modal displays, user views for required duration
6. Impression recorded

### **Scenario 3: Frequency-Limited Ad**
1. Admin creates ad with `ONCE_PER_DAY` frequency
2. User sees ad on Monday
3. User tries to access game on Monday again
4. AdDecisionEngine checks: User already saw this ad today → Don't show
5. User accesses game on Tuesday
6. AdDecisionEngine checks: Last view was Monday → Show ad again

---

## 📝 **SUMMARY**

Image Ads are a sophisticated, admin-controlled advertising system that:
- ✅ Shows ads at strategic, non-intrusive positions
- ✅ Respects user experience with frequency limits
- ✅ Provides detailed tracking and analytics
- ✅ Supports advanced targeting and rotation
- ✅ Integrates seamlessly with fantasy games
- ✅ Fully controlled by admins via Admin Panel

The system is designed to be **elegant, non-intrusive, and revenue-generating** while maintaining a **women-friendly, respectful user experience**.

