// Workout Template Types (what exercises to do)

export interface Workout {
  id: string;
  name: string;
  sections: Section[];
}

export type SectionName = 'Warmup' | 'Rehab' | 'Strength' | 'Cooldown';

export interface Section {
  id: string;
  name: SectionName;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  youtubeVideoId: string;
  notes: string; // persistent user notes
  defaultSets: number;
}

// Workout Session Types (live tracking)

export interface WorkoutSession {
  id: string;
  workoutId: string;
  userId: string;
  startedAt: Date;
  completedAt: Date | null;
  exerciseLogs: ExerciseLog[];
}

export type LoadUnit = 'lb' | 'kg';

export interface SetLog {
  setNumber: number;
  reps: number | null;
  load: number | null;
  loadUnit: LoadUnit;
  rpe: number | null; // 6.0 - 10.0
}

export interface ExerciseLog {
  exerciseId: string;
  isComplete: boolean;
  sets: SetLog[];
}

// UI State Types

export type ProgressState = 'not_started' | 'in_progress' | 'complete';

export interface SectionProgress {
  sectionId: string;
  name: SectionName;
  completed: number;
  total: number;
  state: ProgressState;
}

// Timer Types

export type TimerMode = 'stopwatch' | 'countdown';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  elapsedMs: number;
  targetMs?: number; // for countdown
}

// User Preferences

export interface UserPreferences {
  defaultLoadUnit: LoadUnit;
  autoScrollOnComplete: boolean;
}
