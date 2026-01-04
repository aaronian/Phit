/**
 * Overlays Index
 *
 * This file exports all overlay components from a single location.
 * This pattern is called a "barrel export" and it makes imports cleaner.
 *
 * Instead of:
 *   import LoadKeypad from './components/overlays/LoadKeypad';
 *   import RPEPicker from './components/overlays/RPEPicker';
 *
 * You can do:
 *   import { LoadKeypad, RPEPicker } from './components/overlays';
 */

// Weight input keypad
export { default as LoadKeypad } from './LoadKeypad';

// RPE (Rate of Perceived Exertion) selector
export { default as RPEPicker } from './RPEPicker';

// Stopwatch and countdown timer
export { default as TimerSheet } from './TimerSheet';

// Exercise notes input
export { default as NotesSheet } from './NotesSheet';

// Past performance history
export { default as HistorySheet } from './HistorySheet';

// Re-export the HistoryEntry type for convenience
export type { HistoryEntry } from './HistorySheet';
