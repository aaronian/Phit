# Local-First Firebase Sync Design

## Overview

Add persistent storage to phit using a local-first architecture:
- **Primary storage**: AsyncStorage (fast, offline-capable)
- **Cloud backup**: Firestore (syncs when online)
- **Authentication**: Clerk (existing) bridged to Firebase via Cloud Function

## Requirements

| Requirement | Decision |
|-------------|----------|
| Sync trigger | Periodic (every 2 minutes while app is open) |
| Conflict resolution | None needed (single device usage) |
| Data to sync | Everything: sessions, preferences, custom templates |
| Auth provider | Clerk with Firebase custom token bridge |
| Sync UX | Silent, only show errors |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   React Components              │
│              (useWorkout, usePreferences)       │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                 DataService                     │
│   - Single API for all data operations          │
│   - Manages sync state internally               │
│   - Exposes: get, save, delete, subscribe       │
└─────────────────────┬───────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│  AsyncStorage │           │   Firestore   │
│   (Primary)   │◄─────────►│   (Backup)    │
│  Always used  │   Sync    │  When online  │
└───────────────┘           └───────────────┘
```

**Key Principle**: AsyncStorage is the source of truth. All reads come from local storage. Firestore is purely backup.

## Storage Schema

### AsyncStorage Keys

```
@phit/user                    → UserProfile (from Clerk)
@phit/preferences             → UserPreferences
@phit/templates               → Workout[] (custom templates)
@phit/sessions                → WorkoutSession[] (completed workouts)
@phit/currentSession          → WorkoutSession | null (in-progress)
@phit/syncQueue               → SyncQueueItem[] (pending uploads)
@phit/lastSyncTimestamp       → number (for periodic sync)
```

### Firestore Collections

```
users/{clerkUserId}/
  ├── profile                 → UserProfile doc
  ├── preferences             → UserPreferences doc
  ├── templates/{templateId}  → Workout docs
  └── sessions/{sessionId}    → WorkoutSession docs
```

### New Types

```typescript
// Sync tracking
interface SyncQueueItem {
  id: string;
  collection: 'preferences' | 'templates' | 'sessions';
  documentId: string;
  action: 'upsert' | 'delete';
  data: unknown;
  createdAt: number;
  retryCount: number;
}

// Wrapper for synced data
interface SyncedData<T> {
  data: T;
  lastModified: number;
  syncedAt: number | null;
}
```

## Sync Flow

### Periodic Sync (every 2 minutes)

```
App Foreground
     │
     ▼
┌─────────────────────────────────────┐
│  SyncService.startPeriodicSync()    │
│  - Sets up 2-minute interval        │
│  - Pauses when app backgrounds      │
└─────────────────┬───────────────────┘
                  │
                  ▼ (every 2 min)
┌─────────────────────────────────────┐
│  1. Check network connectivity      │
│  2. Check if user authenticated     │
│  3. Process syncQueue (upload)      │
│  4. Pull remote changes (download)  │
└─────────────────────────────────────┘
```

### Write Flow

1. Write to AsyncStorage immediately (instant user response)
2. Add item to `syncQueue` in AsyncStorage
3. Next sync cycle uploads to Firestore
4. On success, remove from queue

### Download Flow

1. Query Firestore for docs with `lastModified > lastSyncTimestamp`
2. For each newer remote doc, overwrite local AsyncStorage
3. Update `lastSyncTimestamp`

## Clerk-Firebase Authentication

Firebase Cloud Function bridges Clerk auth to Firebase:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Clerk     │────►│    Cloud     │────►│   Firebase   │
│  (user auth) │     │   Function   │     │  (custom     │
│              │     │              │     │   token)     │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Cloud Function**: Takes Clerk JWT, verifies it, returns Firebase custom token.

**Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No network | Sync silently skips, queue persists, retry next cycle |
| Firestore write fails | Item stays in queue, increment retry count |
| 5+ retries on same item | Show toast: "Sync issue - will keep trying" |
| Auth token expired | Refresh Firebase token from Cloud Function |
| Clerk session invalid | Clear local auth state, prompt re-login |

## File Structure

### New Files

```
src/services/
├── firebase.ts          # Firebase config + init
├── storage.ts           # AsyncStorage wrapper (typed keys, JSON handling)
├── clerkFirebase.ts     # Get Firebase token from Cloud Function
├── syncService.ts       # Periodic sync, queue processing
└── dataService.ts       # Unified API: getWorkouts(), saveSession(), etc.

functions/               # Firebase Cloud Functions (new folder at root)
└── src/
    └── index.ts         # createFirebaseToken endpoint
```

### Modified Files

- `src/services/workoutService.ts` - Update to use dataService
- `src/types/index.ts` - Add SyncQueueItem and SyncedData types

### Dependencies to Add

- `firebase-admin` (Cloud Function only)
- `@clerk/clerk-expo` (if not installed)

## Implementation Order

1. Firebase config (`firebase.ts`)
2. AsyncStorage wrapper (`storage.ts`)
3. Data service with local-only operations (`dataService.ts`)
4. Update workoutService to use dataService
5. Cloud Function for Clerk-Firebase bridge
6. Clerk-Firebase client (`clerkFirebase.ts`)
7. Sync service (`syncService.ts`)
8. Integrate sync into app lifecycle
