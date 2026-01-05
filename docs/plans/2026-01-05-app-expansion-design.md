# Phit App Expansion Design

## Overview

Expand Phit from a single-workout demo into a full workout planning app with dashboard navigation, workout scheduling, AI workout creation, exercise catalog, stats tracking, and improved workout session controls.

## Data Architecture

**Local-first with optional Firebase sync:**
- Primary storage: AsyncStorage (fast, offline-capable)
- Optional sync: Firebase Firestore (cloud backup when available)
- User can work offline; data syncs when connected

## Navigation Structure

### Bottom Navigation (2-3 tabs)
- **Home** - Dashboard hub (always visible)
- **Workout** - Active workout screen (visible when session in progress, highlighted)
- **Profile** - Settings/preferences (optional, can defer)

### Screen Hierarchy
```
App
├── BottomNav
│   ├── HomeScreen (Dashboard)
│   ├── WorkoutScreen (active session)
│   └── ProfileScreen (settings)
├── Stack Screens
│   ├── StatsScreen
│   ├── HistoryScreen
│   ├── CatalogScreen
│   ├── WorkoutChatScreen (AI creation)
│   └── WorkoutDetailScreen (view past workout)
└── Modals
    └── ExitWorkoutModal
```

## Screen Designs

### 1. Dashboard (HomeScreen)

Primary hub with cards for all app features.

```
┌─────────────────────────────────┐
│  PHIT                    [gear] │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ TODAY'S WORKOUT         │    │  <- Large card, primary action
│  │ Push Day - Chest/Tris   │    │
│  │ [Start Workout]         │    │
│  │ "Not feeling it?" ->    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌───────────┐ ┌───────────┐    │
│  │ Create    │ │ Browse    │    │  <- Two medium cards
│  │ with AI   │ │ Catalog   │    │
│  └───────────┘ └───────────┘    │
│                                 │
│  ┌───────────┐ ┌───────────┐    │
│  │ History   │ │ Stats     │    │  <- Two smaller cards
│  │ 12 logged │ │ 5 day     │    │
│  └───────────┘ └───────────┘    │
│                                 │
│  [Home]         [Workout]       │  <- Bottom nav
└─────────────────────────────────┘
```

**"Today's Workout" card behavior:**
- Shows scheduled workout if one exists
- "Not feeling it?" link opens alternatives (browse catalog or AI)
- If no schedule: shows "Pick a workout" or quick-start options
- If incomplete workout exists: shows "Resume Workout" instead

### 2. Workout Exit Modal

Triggered by X/back button in WorkoutScreen header.

```
┌─────────────────────────────────┐
│                                 │
│     Leaving Workout?            │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Pause Timer            │    │  <- Stays on screen, pauses timer
│  │  Take a quick break     │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Save & Exit            │    │  <- Saves to incomplete, goes home
│  │  Continue later         │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Cancel Workout         │    │  <- Discards progress, goes home
│  │  Discard progress       │    │
│  └─────────────────────────┘    │
│                                 │
│         [Keep Going]            │  <- Dismisses modal
│                                 │
└─────────────────────────────────┘
```

**Actions:**
- **Pause Timer**: Closes modal, pauses workout timer, shows "Resume" overlay
- **Save & Exit**: Saves session with `pausedAt` timestamp, returns to dashboard
- **Cancel Workout**: Confirmation prompt, then deletes session and returns home

### 3. Sidebar Overlay (WorkoutScreen fix)

**Current issue:** Sidebar and content are side-by-side; expanded sidebar shrinks content.

**Fix:** Expanded sidebar overlays content with dimmed backdrop.

```
COLLAPSED:                    EXPANDED (overlay):
┌──┬──────────────────┐      ┌─────────────────────────┐
│W │                  │      │ Warmup    │             │
│A │  Exercise Card   │  ->  │ Strength  │  (dimmed    │
│R │                  │      │ Cooldown  │   content)  │
│M │                  │      │           │             │
└──┴──────────────────┘      └─────────────────────────┘
```

- Collapsed: 50px inline strip
- Expanded: Overlays with semi-transparent backdrop
- Tapping dimmed area collapses sidebar

### 4. Stats Screen

Accessed occasionally from dashboard card.

```
┌─────────────────────────────────┐
│  <- Stats                       │
├─────────────────────────────────┤
│  5 Day Streak                   │  <- Streak banner
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
├─────────────────────────────────┤
│  This Week        All Time      │  <- Toggle
│  ┌─────────┐ ┌─────────┐        │
│  │ 3       │ │ 12,450  │        │
│  │workouts │ │ lbs     │        │
│  └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│  Calendar Heatmap               │
│  ┌─────────────────────────┐    │
│  │ Jan                     │    │
│  │ ░░▓░░▓░ ░░▓░░░░ ...    │    │  <- GitHub-style activity
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  Personal Records               │
│  Bench Press      185 lb  ↑     │
│  Squat            225 lb  ↑     │
│  Deadlift         275 lb  -     │
└─────────────────────────────────┘
```

### 5. AI Workout Creation (WorkoutChatScreen)

Chat interface for generating workouts via Gemini API.

**Initial state:**
```
┌─────────────────────────────────┐
│  <- Create Workout              │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │  What kind of workout   │    │
│  │  are you looking for?   │    │
│  └─────────────────────────┘    │
│                                 │
│  Quick options:                 │
│  ┌─────────┐ ┌─────────┐        │
│  │ Upper   │ │ Lower   │        │
│  │ Body    │ │ Body    │        │
│  └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌─────────┐        │
│  │ Push    │ │ Pull    │        │
│  └─────────┘ └─────────┘        │
│                                 │
├─────────────────────────────────┤
│  [I have 20 min for chest...  ] │
│                          [Send] │
└─────────────────────────────────┘
```

**After generation:**
```
┌─────────────────────────────────┐
│  Generated Workout              │
├─────────────────────────────────┤
│  Quick Chest & Tris (20 min)    │
│                                 │
│  - Bench Press - 3x8            │
│  - Incline DB Press - 3x10      │
│  - Tricep Pushdown - 3x12       │
│  - Dips - 2x AMRAP              │
│                                 │
│  [Regenerate]  [Edit]  [Start]  │
└─────────────────────────────────┘
```

### 6. History Screen

List of completed/incomplete workouts.

```
┌─────────────────────────────────┐
│  <- History                     │
├─────────────────────────────────┤
│  Incomplete                     │
│  ┌─────────────────────────┐    │
│  │ Push Day (paused)       │    │
│  │ Yesterday - 45 min      │    │
│  │              [Resume]   │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  Completed                      │
│  ┌─────────────────────────┐    │
│  │ Pull Day                │    │
│  │ Jan 3 - 52 min - 8,240 lb   │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ Leg Day                 │    │
│  │ Jan 1 - 48 min - 12,100 lb  │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 7. Exercise Catalog Screen

Browse exercises by muscle group (uses imported exercise database).

```
┌─────────────────────────────────┐
│  <- Exercise Catalog    [search]│
├─────────────────────────────────┤
│  [Chest] [Back] [Legs] [Arms]..│  <- Filter chips
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ [img] Bench Press       │    │
│  │       Chest, Triceps    │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ [img] Incline DB Press  │    │
│  │       Upper Chest       │    │
│  └─────────────────────────┘    │
│  ...                            │
└─────────────────────────────────┘
```

Tap exercise to see details, video, and add to a workout.

## New Types

```typescript
// Workout scheduling
interface WorkoutPlan {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  workoutId: string;
}

// Tracking completed workouts
interface WorkoutHistory {
  sessionId: string;
  workoutId: string;
  workoutName: string;
  completedAt: Date | null;
  pausedAt: Date | null; // null = completed, has value = incomplete
  totalVolume: number; // total lbs/kg lifted
  duration: number; // milliseconds
}

// Personal records
interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  weightUnit: LoadUnit;
  reps: number;
  date: Date;
}

// User stats aggregate
interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalVolume: number;
  workoutsThisWeek: number;
  volumeThisWeek: number;
}

// Session state extension
type SessionState = 'active' | 'paused' | 'completed' | 'cancelled';
```

## Files to Create

### Screens
| File | Purpose |
|------|---------|
| `src/screens/HomeScreen.tsx` | Dashboard with cards |
| `src/screens/StatsScreen.tsx` | Streak, volume, heatmap, PRs |
| `src/screens/HistoryScreen.tsx` | Past workouts list |
| `src/screens/CatalogScreen.tsx` | Exercise browser |
| `src/screens/WorkoutChatScreen.tsx` | AI workout creation |

### Components
| File | Purpose |
|------|---------|
| `src/components/BottomNav.tsx` | Tab navigation |
| `src/components/DashboardCard.tsx` | Reusable card component |
| `src/components/ExitWorkoutModal.tsx` | Pause/exit confirmation |
| `src/components/StreakBanner.tsx` | Streak display |
| `src/components/CalendarHeatmap.tsx` | Activity grid |

### Services
| File | Purpose |
|------|---------|
| `src/services/storageService.ts` | AsyncStorage wrapper |
| `src/services/statsService.ts` | Stats calculations |
| `src/services/geminiService.ts` | AI workout generation |

### Data
| File | Purpose |
|------|---------|
| `src/data/exerciseCatalog.ts` | Exercise database (from GitHub repo) |

## Files to Modify

| File | Changes |
|------|---------|
| `App.tsx` | Add navigation container, bottom tabs |
| `src/screens/WorkoutScreen.tsx` | Add exit button, fix sidebar overlay |
| `src/contexts/WorkoutSessionContext.tsx` | Add pause/cancel actions, session state |
| `src/types/index.ts` | Add new types |

## Implementation Phases

### Phase 1: Core Navigation & Exit Flow
1. Add React Navigation (bottom tabs + stack)
2. Create HomeScreen with dashboard cards
3. Move current home content to HomeScreen
4. Add exit button + ExitWorkoutModal to WorkoutScreen
5. Fix sidebar overlay behavior
6. Add pause/cancel logic to WorkoutSessionContext

### Phase 2: History & Stats
1. Create storageService for AsyncStorage
2. Save completed workouts to history
3. Create HistoryScreen
4. Create StatsScreen with basic metrics
5. Add streak tracking

### Phase 3: Exercise Catalog
1. Import exercise database (free-exercise-db or similar)
2. Create CatalogScreen with filtering
3. Exercise detail view

### Phase 4: AI Workout Creation
1. Set up Gemini API integration
2. Create WorkoutChatScreen
3. Parse AI response into Workout type
4. Save and start generated workouts

### Phase 5: Scheduling & Polish
1. Add workout scheduling (calendar picker)
2. "Today's Workout" logic
3. Calendar heatmap component
4. PR tracking
5. Firebase sync (optional)

## Dependencies to Add

```json
{
  "@react-navigation/native": "^7.x",
  "@react-navigation/bottom-tabs": "^7.x",
  "@react-navigation/native-stack": "^7.x",
  "react-native-screens": "latest",
  "@google/generative-ai": "^0.x"
}
```

## Open Questions (Deferred)

1. Which exercise catalog repo to use? (free-exercise-db recommended for simplicity)
2. Curated workout plans source?
3. Firebase auth flow for cloud sync?
