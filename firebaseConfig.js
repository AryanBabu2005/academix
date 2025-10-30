// In firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// --- Import the new dependencies here ---
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbl9w9wziCJG_oKf6XJIuLNzjeMuT_h6g",
  authDomain: "academix-531c3.firebaseapp.com",
  projectId: "academix-531c3",
  storageBucket: "academix-531c3.firebasestorage.app",
  messagingSenderId: "190995422528",
  appId: "1:190995422528:web:acae49cba9e94c22c16ea5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- Initialize Auth with persistence ---
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});