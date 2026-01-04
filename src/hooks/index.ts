/**
 * Hooks barrel file
 *
 * A "barrel file" is a file that re-exports items from other files.
 * This lets you import from one place instead of remembering individual paths.
 *
 * Without barrel: import { useTimer } from '../hooks/useTimer';
 * With barrel:    import { useTimer } from '../hooks';
 */

export { useTimer } from './useTimer';
export { useExerciseHistory } from './useExerciseHistory';
