/**
 * Clerk-Firebase Authentication Bridge
 *
 * Bridges Clerk authentication to Firebase by:
 * 1. Getting the Clerk session token
 * 2. Calling a Cloud Function to exchange it for a Firebase custom token
 * 3. Signing into Firebase with that custom token
 *
 * This enables Firestore security rules to work with Clerk-authenticated users.
 *
 * Requires:
 * - @clerk/clerk-expo to be installed
 * - Cloud Function deployed at EXPO_PUBLIC_FIREBASE_TOKEN_ENDPOINT
 * - Firebase project configured with custom token support
 */

import { signInWithCustomToken, signOut, User } from 'firebase/auth';
import { auth, isFirebaseEnabled } from './firebase';

// Cloud Function endpoint for minting Firebase tokens
// This function verifies the Clerk JWT and returns a Firebase custom token
const TOKEN_ENDPOINT = process.env.EXPO_PUBLIC_FIREBASE_TOKEN_ENDPOINT;

// Track current Firebase user state
let currentFirebaseUser: User | null = null;

/**
 * Check if authentication bridge is properly configured
 */
export function isAuthBridgeConfigured(): boolean {
  return (
    isFirebaseEnabled() &&
    auth !== null &&
    TOKEN_ENDPOINT !== undefined &&
    TOKEN_ENDPOINT !== ''
  );
}

/**
 * Get Clerk session token (requires @clerk/clerk-expo)
 *
 * This is a placeholder that components should call with their Clerk session.
 * The actual token retrieval happens in the component that has access to Clerk's hooks.
 *
 * Usage in component:
 * ```
 * import { useAuth } from '@clerk/clerk-expo';
 * import { signInToFirebase } from './clerkFirebase';
 *
 * const { getToken } = useAuth();
 * const clerkToken = await getToken();
 * await signInToFirebase(clerkToken);
 * ```
 */

/**
 * Exchange Clerk token for Firebase custom token via Cloud Function
 */
async function getFirebaseToken(clerkToken: string): Promise<string> {
  if (!TOKEN_ENDPOINT) {
    throw new Error('Firebase token endpoint not configured');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clerkToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Firebase token: ${error}`);
  }

  const data = await response.json();

  if (!data.firebaseToken) {
    throw new Error('Invalid response from token endpoint');
  }

  return data.firebaseToken;
}

/**
 * Sign into Firebase using a Clerk session token
 *
 * Call this after Clerk authentication is complete.
 * The syncService will detect the Firebase auth state and start syncing.
 *
 * @param clerkToken - Session token from Clerk's getToken()
 * @returns The Firebase user object, or null if auth bridge isn't configured
 */
export async function signInToFirebase(
  clerkToken: string
): Promise<User | null> {
  if (!isAuthBridgeConfigured()) {
    console.log('Auth bridge not configured, skipping Firebase sign-in');
    return null;
  }

  if (!auth) {
    return null;
  }

  try {
    // Exchange Clerk token for Firebase token
    const firebaseToken = await getFirebaseToken(clerkToken);

    // Sign into Firebase
    const credential = await signInWithCustomToken(auth, firebaseToken);
    currentFirebaseUser = credential.user;

    console.log('Signed into Firebase:', credential.user.uid);
    return credential.user;
  } catch (error) {
    console.error('Firebase sign-in failed:', error);
    throw error;
  }
}

/**
 * Sign out of Firebase
 *
 * Call this when the user signs out of Clerk.
 */
export async function signOutOfFirebase(): Promise<void> {
  if (!auth) {
    return;
  }

  try {
    await signOut(auth);
    currentFirebaseUser = null;
    console.log('Signed out of Firebase');
  } catch (error) {
    console.error('Firebase sign-out failed:', error);
    throw error;
  }
}

/**
 * Get the current Firebase user
 */
export function getFirebaseUser(): User | null {
  return auth?.currentUser ?? null;
}

/**
 * Check if user is authenticated with Firebase
 */
export function isFirebaseAuthenticated(): boolean {
  return auth?.currentUser !== null;
}

/**
 * Listen to Firebase auth state changes
 *
 * Useful for updating UI or triggering sync when auth state changes.
 */
export function onFirebaseAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!auth) {
    // No auth available, call with null immediately and return no-op unsubscribe
    callback(null);
    return () => {};
  }

  const unsubscribe = auth.onAuthStateChanged(callback);
  return unsubscribe;
}
