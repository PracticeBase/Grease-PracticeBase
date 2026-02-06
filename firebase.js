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
  apiKey: "AIzaSyBId5CDuFdsSHYP2Hip3bwkBsyut1f_0fI",
  authDomain: "practicebase-8762h8b2.firebaseapp.com",
  projectId: "practicebase-8762h8b2",
  storageBucket: "practicebase-8762h8b2.firebasestorage.app",
  messagingSenderId: "214656580811",
  appId: "1:214656580811:web:0d113c9305729ae9c9ef4e",
  measurementId: "G-FZ2JEGH91H"
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
