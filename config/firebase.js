import { initializeApp } from "firebase/app";
import { getAuth,initializeAuth, getReactNativePersistence, } from "firebase/auth";
import {FIREBASE_API_KEY, FIREBASE_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_BUCKET, SENDER_ID, APP_ID} from '@env';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_BUCKET,
  messagingSenderId: SENDER_ID,
  appId: APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth =initializeAuth(app, {persistence: getReactNativePersistence(ReactNativeAsyncStorage),});

