/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, setLogLevel } from 'firebase/firestore';

setLogLevel('silent');


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "emonxyz-48285.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "emonxyz-48285",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "emonxyz-48285.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const originalConsoleError = console.error;
console.error = (...args) => {
  const argStr = args.map(a => typeof a === 'object' ? JSON.stringify(a, Object.getOwnPropertyNames(a)) : String(a)).join(' ');
  if (argStr.includes("PERMISSION_DENIED") || argStr.includes("CANCELLED") || argStr.includes("GrpcConnection RPC")) {
    return;
  }
  originalConsoleError(...args);
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)");
export const auth = getAuth(app);
