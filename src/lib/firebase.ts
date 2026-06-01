/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAlqrNk_-ZxBbinAw8FxMRefiF9025_JCo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "notional-acre-4sjh2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "notional-acre-4sjh2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "notional-acre-4sjh2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "73118880539",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:73118880539:web:6412f38e40ff8eb56079be"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-2ce2e3ea-fdac-4626-b157-6f3d919c293c");
export const auth = getAuth(app);
