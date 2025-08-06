// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration - can use environment variables or fallback to defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCU-KVaFy8pKJ7BhWsC90u0nyzKOqC21j0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "btk-akademi-hackathon.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "btk-akademi-hackathon",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "btk-akademi-hackathon.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "536428827175",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:536428827175:web:83f09d6d4c5754e6497402"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics (only in production and if supported)
let analytics = null;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };

// Development environment setup
if (import.meta.env.DEV) {
  // Connect to Firebase emulators in development
  // Uncomment these lines if you want to use Firebase emulators locally
  
  // if (!db._settings?.host?.includes('localhost')) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  // }
  
  // if (!auth.config.emulator) {
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  // }
  
  // if (!storage._host?.includes('localhost')) {
  //   connectStorageEmulator(storage, 'localhost', 9199);
  // }
}

export default app;