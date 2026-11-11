import {getApps,initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';

const config={apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY,authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID};
// Firebase web configuration is public. The server-side Firebase project ID must match.
export const firebaseConfigured=!!(config.apiKey&&config.authDomain&&config.projectId&&config.appId);
export const firebaseAuth=firebaseConfigured?getAuth(getApps()[0]??initializeApp(config)):null;
