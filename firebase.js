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
  apiKey: "AIzaSyAecPf2aXR0j1buuDmz9MVrS8aYINs1eCU",
  authDomain: "grease-practicebase.firebaseapp.com",
  projectId: "grease-practicebase",
  storageBucket: "grease-practicebase.firebasestorage.app",
  messagingSenderId: "696484090016",
  appId: "1:696484090016:web:4d7bfe336d842ed946b9c5",
  measurementId: "G-4C78RPXQ99"
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

