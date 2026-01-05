# Phit

A React Native fitness tracking app built with Expo for logging workouts and tracking progress.

## Features

- **Workout Tracking**: Log exercises, sets, reps, and weights during workouts
- **Real-time Progress**: Side panel shows section progress as you work through exercises
- **Session Management**: Pause, save & exit, or cancel workouts with confirmation flows
- **Home Dashboard**: Quick access to start workouts and view history (in development)
- **Dark Theme**: Modern dark UI optimized for gym use

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (bottom tabs)
- **State Management**: React Context API
- **Backend**: Firebase (Firestore for data, real-time sync)
- **Language**: TypeScript

## Project Structure

```
src/
├── components/
│   ├── ExerciseCard/       # Exercise logging UI
│   ├── SidePanel/          # Progress sidebar
│   ├── ExitWorkoutModal.tsx # Exit confirmation modal
│   └── overlays/           # Load keypad, notes, history sheets
├── contexts/
│   └── WorkoutSessionContext.tsx  # Global workout state
├── screens/
│   ├── HomeScreen.tsx      # Dashboard with action cards
│   └── WorkoutScreen.tsx   # Main workout view
├── services/
│   ├── firebase.ts         # Firebase configuration
│   ├── workoutService.ts   # Workout CRUD operations
│   ├── syncService.ts      # Background sync
│   └── storage.ts          # Local storage utilities
└── types/                  # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Expo Go app on your mobile device (for testing)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your device.

## Development Status

### Completed
- Workout session tracking with exercise cards
- Side panel with section progress
- Load/reps input overlays
- Bottom tab navigation (Home + Workout)
- Exit workout modal with pause/save/cancel options
- Firebase integration and real-time sync infrastructure

### In Progress
- Home screen dashboard functionality
- Workout catalog and templates
- History and statistics views

## License

Private project - not for distribution.
