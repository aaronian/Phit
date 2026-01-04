# Master Workout View - Technical Specification

## Overview

A workout tracking app for iOS with a vertical scrolling architecture that displays all exercises in a continuous view, featuring a side panel for phase navigation and rich exercise cards with video demos, timers, notes, and data entry.

**Target:** Personal use on iPhone (no App Store distribution)

---

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Framework | React Native + Expo | Fastest path to iPhone, JavaScript ecosystem |
| Backend | Firebase (Auth + Firestore) | Cloud sync, generous free tier, offline support |
| Video | YouTube iFrame embeds | No hosting costs, extensive exercise library |
| Animations | React Native Reanimated | Smooth scroll and overlay transitions |
| Distribution | Expo Go (dev) / EAS Build (standalone) | No App Store required |

---

## App Structure

```
┌─────────────────────────────────────────────────┐
│  Master Workout View                            │
├────────┬────────────────────────────────────────┤
│        │                                        │
│  Side  │   Vertical Scroll Container            │
│  Panel │   ┌────────────────────────────────┐   │
│        │   │ Exercise Card 1                │   │
│ Warmup │   │ [YouTube Video]                │   │
│ ────── │   │ [Toolbar: Timer|Notes|History] │   │
│ Rehab  │   │ [Set/Reps/Load/RPE Table]      │   │
│ ────── │   │ [Mark All] [Done]              │   │
│ Strngth│   └────────────────────────────────┘   │
│ ────── │   ┌────────────────────────────────┐   │
│ Cool   │   │ Exercise Card 2                │   │
│        │   │ ...                            │   │
│        │   └────────────────────────────────┘   │
└────────┴────────────────────────────────────────┘
```

---

## Exercise Card Component

### Video Section
- YouTube embed (16:9 aspect ratio, ~200px height)
- Tap to play/pause, no autoplay
- Lazy loading: only 2-3 videos buffered at a time

### Toolbar Row
```
┌──────────────┬──────────────┬──────────────┐
│  ⏱ Timer     │  📝 Notes    │  📊 History  │
└──────────────┴──────────────┴──────────────┘
```

**Timer:**
- Opens bottom sheet with stopwatch (count up) and countdown timer
- Runs in background while scrolling
- Floating indicator on card when active: `⏱ 1:32`
- Audio/vibration alert when countdown completes

**Notes:**
- Bottom sheet with text input
- Saves per-exercise, persists across all workouts
- Use case: form cues, equipment notes

**History:**
- Bottom sheet showing last 5 sessions for this exercise
- Displays: date, sets×reps @ load, RPE
- Tap a row to auto-fill those values into current session

### Data Entry Table

| Set | Reps | Load | RPE |
|-----|------|------|-----|
| 1   | 8    | 135 lb | 7.5 |
| 2   | 8    | 135 lb | 8.0 |
| + Add Set |

- **Reps:** Tap opens number keypad overlay
- **Load:** Tap opens keypad with lb/kg toggle
- **RPE:** Tap opens scroll-picker (6.0 → 10.0 in 0.5 increments)

### Footer Buttons
- **Mark All:** Copies first row's values to all rows
- **Done:** Marks exercise complete, triggers auto-scroll

---

## Overlay Behaviors (Keypad & RPE Picker)

### Architecture
```
┌─────────────────────────────────┐
│  Main Scroll View (frozen)      │
│  ┌─────────────────────────────┐│
│  │ Exercise Cards...           ││
│  │       ┌─────────────────┐   ││
│  │       │ ← Active Cell   │   ││
│  │       └─────────────────┘   ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  ▓▓▓ Semi-transparent backdrop  │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │  Overlay (bottom sheet)     ││
│  │  [Keypad or Picker]         ││
│  │  [Confirm] [Cancel]         ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### Behaviors

1. **Scroll Lock:** Main scroll disabled when overlay is open
2. **Anchor Visibility:** Active cell scrolls into view before overlay opens
3. **Load Keypad:**
   - Number pad (0-9), backspace, decimal point
   - lb/kg toggle at top (persists as user preference)
   - "Done" confirms, tap-outside cancels
4. **RPE Picker:**
   - Vertical scroll wheel (iOS picker style)
   - Values: 6.0, 6.5, 7.0... up to 10.0
   - Haptic feedback on each tick
5. **Dismiss:** 300ms slide-down animation, scroll unlocks

---

## Side Panel Navigation

### Layout
```
┌────────────┐
│  PHIT      │  ← App logo/name
├────────────┤
│            │
│  ● Warmup  │  ← Green dot = complete
│    (3/3)   │
│            │
│  ◐ Rehab   │  ← Half dot = in progress
│    (2/5)   │
│            │
│  ○ Strength│  ← Empty dot = not started
│    (0/6)   │
│            │
│  ○ Cooldown│
│    (0/3)   │
│            │
├────────────┤
│  ⏱ 42:15   │  ← Total workout timer
└────────────┘
```

### Behaviors

1. **Tap to Jump:** Smooth animated scroll (~400ms) to section's first exercise
2. **Progress States:**
   - `○` Empty: 0 exercises done
   - `◐` Half-filled: 1+ done, not all
   - `●` Filled: All complete
3. **Active Highlight:** Current section (by scroll position) has background highlight
4. **Collapse/Expand:** Can collapse to thin strip (dots only), swipe to expand
5. **Live Updates:** Counts update immediately on exercise completion

---

## Auto-Scroll on Completion

### Flow
```
User taps "Done" on Exercise 4
         ↓
Card 4: green flash + checkmark animation
         ↓
300ms pause
         ↓
Smooth scroll to Exercise 5 (card top aligns with viewport top)
         ↓
Ready for next exercise
```

### Edge Cases

**Last Exercise in Section:**
- Side panel section shows ● (complete)
- Auto-scrolls to next section's first exercise
- Toast: "Warmup complete! Starting Rehab..."

**Final Exercise of Workout:**
- Completion modal: "Workout Complete!"
- Summary: total time, exercises completed, total volume
- Buttons: "Save & Exit" / "Review Workout"

**Skipping Exercises:**
- User can scroll past incomplete exercises
- "Done" only marks current exercise
- Incomplete exercises stay unmarked

**Undo:**
- 3-second toast after completion: "Exercise complete — Undo"
- Tap to revert completion state

---

## Data Model

### Workout Template
```typescript
interface Workout {
  id: string
  name: string
  sections: Section[]
}

interface Section {
  id: string
  name: "Warmup" | "Rehab" | "Strength" | "Cooldown"
  exercises: Exercise[]
}

interface Exercise {
  id: string
  name: string
  youtubeVideoId: string
  notes: string              // persistent user notes
  defaultSets: number
}
```

### Workout Session (Live Tracking)
```typescript
interface WorkoutSession {
  id: string
  workoutId: string
  userId: string
  startedAt: Timestamp
  completedAt: Timestamp | null
  exerciseLogs: ExerciseLog[]
}

interface ExerciseLog {
  exerciseId: string
  isComplete: boolean
  sets: SetLog[]
}

interface SetLog {
  setNumber: number
  reps: number | null
  load: number | null
  loadUnit: "lb" | "kg"
  rpe: number | null         // 6.0 - 10.0
}
```

### State Flow
```
Firebase Firestore (source of truth)
         ↓
    Real-time listener
         ↓
    React Context: WorkoutSessionContext
         ↓
    ┌─────────────┬─────────────────┐
    │ Side Panel  │  Exercise Cards │
    │ (reads      │  (reads + writes│
    │  progress)  │   set data)     │
    └─────────────┴─────────────────┘
```

### Progress Calculation
```typescript
const sectionProgress = section.exercises.filter(e =>
  session.exerciseLogs.find(log =>
    log.exerciseId === e.id && log.isComplete
  )
).length / section.exercises.length
```

### Offline Handling
- Firestore built-in offline persistence
- Workout can be completed offline
- Auto-syncs when connection returns

---

## File Structure (Proposed)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (main)/
│       ├── workout/[id].tsx      # Master Workout View
│       └── index.tsx             # Workout list
├── components/
│   ├── ExerciseCard/
│   │   ├── index.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── Toolbar.tsx
│   │   ├── DataTable.tsx
│   │   └── SetRow.tsx
│   ├── SidePanel/
│   │   ├── index.tsx
│   │   └── SectionButton.tsx
│   └── overlays/
│       ├── LoadKeypad.tsx
│       ├── RPEPicker.tsx
│       ├── TimerSheet.tsx
│       ├── NotesSheet.tsx
│       └── HistorySheet.tsx
├── contexts/
│   └── WorkoutSessionContext.tsx
├── hooks/
│   ├── useWorkoutSession.ts
│   ├── useExerciseHistory.ts
│   └── useTimer.ts
├── services/
│   ├── firebase.ts
│   └── workoutService.ts
└── types/
    └── index.ts
```

---

## Summary

This design provides:

1. **Vertical Architecture** - All exercises in one scrollable view, no screen-to-screen navigation
2. **Global Navigation** - Side panel for jumping between Warmup, Rehab, Strength, Cooldown
3. **Rich Exercise Cards** - YouTube video, timer/notes/history toolbar, data entry table
4. **Smart Overlays** - Load keypad and RPE picker that preserve scroll position
5. **Progress Tracking** - Visual indicators in side panel, auto-scroll on completion
6. **Cloud Sync** - Firebase backend with offline support
7. **Personal Distribution** - Expo/EAS build for iPhone without App Store
