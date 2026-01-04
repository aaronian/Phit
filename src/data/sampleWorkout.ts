/**
 * Sample Workout Data
 *
 * This file contains a sample workout for testing the app.
 * In production, this data would come from Firebase.
 *
 * You can use this to test the UI before connecting to the backend,
 * or as a template for creating your own workouts.
 */

import type { Workout } from '../types';

export const sampleWorkout: Workout = {
  id: 'sample-workout-1',
  name: 'Full Body Workout',
  sections: [
    {
      id: 'warmup',
      name: 'Warmup',
      exercises: [
        {
          id: 'exercise-1',
          name: 'Jumping Jacks',
          youtubeVideoId: 'iSSAk4XCsRA', // Example YouTube video ID
          notes: '',
          defaultSets: 1,
        },
        {
          id: 'exercise-2',
          name: 'Arm Circles',
          youtubeVideoId: 'vC5UZg5HtwI',
          notes: '',
          defaultSets: 1,
        },
        {
          id: 'exercise-3',
          name: 'Leg Swings',
          youtubeVideoId: 'cJazxwLxLn8',
          notes: '',
          defaultSets: 1,
        },
      ],
    },
    {
      id: 'rehab',
      name: 'Rehab',
      exercises: [
        {
          id: 'exercise-4',
          name: 'Band Pull-Aparts',
          youtubeVideoId: 'AwmtQxW9MD4',
          notes: 'Focus on squeezing shoulder blades',
          defaultSets: 3,
        },
        {
          id: 'exercise-5',
          name: 'Face Pulls',
          youtubeVideoId: 'rep-qVOkqgk',
          notes: 'Light weight, high reps',
          defaultSets: 3,
        },
        {
          id: 'exercise-6',
          name: 'Dead Hangs',
          youtubeVideoId: 'TAqyZmhiIT8',
          notes: 'Hold for time, not reps',
          defaultSets: 2,
        },
        {
          id: 'exercise-7',
          name: 'Hip 90/90 Stretch',
          youtubeVideoId: 'wiFNA3sqjCA',
          notes: '',
          defaultSets: 2,
        },
        {
          id: 'exercise-8',
          name: 'Cat-Cow Stretch',
          youtubeVideoId: 'kqnua4rHVVA',
          notes: '',
          defaultSets: 2,
        },
      ],
    },
    {
      id: 'strength',
      name: 'Strength',
      exercises: [
        {
          id: 'exercise-9',
          name: 'Barbell Squat',
          youtubeVideoId: 'ultWZbUMPL8',
          notes: 'Keep chest up, depth to parallel',
          defaultSets: 4,
        },
        {
          id: 'exercise-10',
          name: 'Bench Press',
          youtubeVideoId: 'gRVjAtPip0Y',
          notes: 'Touch chest, pause at bottom',
          defaultSets: 4,
        },
        {
          id: 'exercise-11',
          name: 'Barbell Row',
          youtubeVideoId: 'FWJR5Ve8bnQ',
          notes: 'Pull to belly button',
          defaultSets: 4,
        },
        {
          id: 'exercise-12',
          name: 'Overhead Press',
          youtubeVideoId: '_RlRDWO2jfg',
          notes: 'Full lockout at top',
          defaultSets: 3,
        },
        {
          id: 'exercise-13',
          name: 'Romanian Deadlift',
          youtubeVideoId: 'JCXUYuzwNrM',
          notes: 'Feel hamstring stretch',
          defaultSets: 3,
        },
        {
          id: 'exercise-14',
          name: 'Pull-ups',
          youtubeVideoId: 'eGo4IYlbE5g',
          notes: 'Full range of motion',
          defaultSets: 3,
        },
      ],
    },
    {
      id: 'cooldown',
      name: 'Cooldown',
      exercises: [
        {
          id: 'exercise-15',
          name: 'Standing Quad Stretch',
          youtubeVideoId: 'BflNfr7lGP0',
          notes: '',
          defaultSets: 1,
        },
        {
          id: 'exercise-16',
          name: 'Pigeon Pose',
          youtubeVideoId: 'KULsu6re1MI',
          notes: 'Hold each side 30 seconds',
          defaultSets: 1,
        },
        {
          id: 'exercise-17',
          name: "Child's Pose",
          youtubeVideoId: 'qzk8Rs54c7k',
          notes: 'Relax and breathe',
          defaultSets: 1,
        },
      ],
    },
  ],
};

/**
 * Total exercise count for reference:
 * - Warmup: 3 exercises
 * - Rehab: 5 exercises
 * - Strength: 6 exercises
 * - Cooldown: 3 exercises
 * - Total: 17 exercises
 */
