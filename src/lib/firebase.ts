/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, setLogLevel } from 'firebase/firestore';

setLogLevel('silent');


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDYoNvGjDRk-HDFhuTpF4eaYJExqDyF1p0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "emonxyz-48285.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "emonxyz-48285",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "emonxyz-48285.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1035995553022",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1035995553022:web:a5843d6cb15f10464c99af"
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
