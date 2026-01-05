/**
 * Firebase Cloud Functions for Phit
 *
 * Main function: createFirebaseToken
 * - Receives a Clerk session JWT
 * - Verifies it using Clerk's backend SDK
 * - Mints a Firebase custom token with the Clerk user ID
 * - Returns the Firebase token to the client
 *
 * Deployment:
 *   1. Set Clerk secret key: firebase functions:secrets:set CLERK_SECRET_KEY
 *   2. Deploy: firebase deploy --only functions
 *
 * Environment:
 *   - CLERK_SECRET_KEY: Your Clerk secret key (set via Firebase secrets)
 */

import { onRequest, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createClerkClient } from '@clerk/backend';

// Initialize Firebase Admin SDK
// Uses default credentials when deployed to Cloud Functions
initializeApp();

// Clerk client - initialized lazily to allow secret to be loaded
let clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient(): ReturnType<typeof createClerkClient> {
  if (!clerkClient) {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new HttpsError(
        'failed-precondition',
        'CLERK_SECRET_KEY not configured'
      );
    }
    clerkClient = createClerkClient({ secretKey });
  }
  return clerkClient;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Cloud Function: Create Firebase Token from Clerk JWT
 *
 * Request:
 *   POST with Authorization: Bearer <clerk-session-token>
 *
 * Response:
 *   { firebaseToken: string }
 *
 * Errors:
 *   - 401: Missing or invalid Clerk token
 *   - 500: Internal error (Clerk verification failed, Firebase minting failed)
 */
export const createFirebaseToken = onRequest(
  {
    cors: true, // Enable CORS for mobile app requests
    secrets: ['CLERK_SECRET_KEY'], // Load secret at runtime
  },
  async (request, response) => {
    // Only allow POST requests
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Extract Clerk token from Authorization header
    const clerkToken = extractBearerToken(request.headers.authorization);

    if (!clerkToken) {
      response.status(401).json({ error: 'Missing Authorization header' });
      return;
    }

    try {
      // Verify the Clerk session token
      const clerk = getClerkClient();

      // Verify the session token and get the claims
      // This throws if the token is invalid or expired
      const verifiedToken = await clerk.verifyToken(clerkToken);

      if (!verifiedToken.sub) {
        response.status(401).json({ error: 'Invalid token: no subject' });
        return;
      }

      // The subject (sub) claim is the Clerk user ID
      const clerkUserId = verifiedToken.sub;

      // Create a Firebase custom token with the Clerk user ID
      // This allows Firestore security rules to use request.auth.uid
      const firebaseAuth = getAuth();
      const firebaseToken = await firebaseAuth.createCustomToken(clerkUserId, {
        // Optional: Add custom claims from Clerk
        clerkUserId: clerkUserId,
      });

      response.json({ firebaseToken });
    } catch (error) {
      console.error('Token exchange failed:', error);

      // Check if it's a Clerk verification error
      if (error instanceof Error) {
        if (
          error.message.includes('expired') ||
          error.message.includes('invalid')
        ) {
          response.status(401).json({ error: 'Invalid or expired Clerk token' });
          return;
        }
      }

      response.status(500).json({ error: 'Token exchange failed' });
    }
  }
);
