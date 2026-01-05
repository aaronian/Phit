/**
 * Firebase Configuration
 *
 * Initializes Firebase app, Firestore, and Auth.
 * Credentials are loaded from environment variables (see .env.local).
 *
 * EXPO_PUBLIC_ prefix makes these available in the Expo runtime.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate that required config is present
const validateConfig = () => {
  const required = ['apiKey', 'projectId', 'appId'] as const;
  const missing = required.filter(key => !firebaseConfig[key]);

  if (missing.length > 0) {
    console.warn(
      `Firebase config missing: ${missing.join(', ')}. ` +
      'Cloud sync will be disabled. Add values to .env.local'
    );
    return false;
  }
  return true;
};

// Initialize Firebase only once, and only if config is valid
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const isConfigValid = validateConfig();

if (isConfigValid) {
  // Check if already initialized (hot reload safety)
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);
}

// Helper to check if Firebase is available
export const isFirebaseEnabled = (): boolean => {
  return app !== null && db !== null;
};

export { app, db, auth };
export default app;
