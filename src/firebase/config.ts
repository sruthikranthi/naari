/**
 * Firebase configuration using environment variables with fallbacks for development.
 * In production, these should be set via Vercel environment variables.
 * 
 * IMPORTANT: All values must be provided. If environment variables are not set,
 * the fallback values will be used (for development only).
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCuvvA428PsDbav33ekXeSgL7cESaxgpKs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-573678501-5e40f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-573678501-5e40f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-573678501-5e40f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "654559531806",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:654559531806:web:eb66ec0bb722ae93ed2f0f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-JVSBEY6DKC",
};
