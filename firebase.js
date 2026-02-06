// firebase.js
// Replace firebaseConfig with your project's credentials.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  updateDoc,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ====== CONFIGURE THIS ======
   Replace the values below with your Firebase project's config.
*/
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

/* Initialize */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* Re-export commonly used Firestore helpers and Auth helpers */
export {
  app,
  db,
  auth,

  // Auth helpers
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,

  // Firestore functions
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
  updateDoc,
  getDocs,
  limit
};
