import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId,
});

// Since we have a custom databaseId, we must pass it to getFirestore.
// If it's empty, getFirestore uses "(default)" automatically.
export const firestoreDB = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);
