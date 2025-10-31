// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAu73_zlphZ0VNxtHxzPSBMSC0TBMN6oVc",
  authDomain: "ecgroup-instant-polling-3183e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecgroup-instant-polling-3183e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecgroup-instant-polling-3183e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "488152533133",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:488152533133:web:f139e961d97a7f76a9bac4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LL8ZT9XFSJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const analytics = getAnalytics(app);

// Collection names
export const COLLECTIONS = {
  POLLS: 'polls',
  POLL_SETS: 'poll_sets',
  VOTES: 'votes'
}