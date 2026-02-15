// firebase.js — Modular Firebase v9+ setup

// ------------------------------
// IMPORTS
// ------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  getDownloadURL,
  listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


// ------------------------------
// CONFIG
// ------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAecPf2aXR0j1buuDmz9MVrS8aYINs1eCU",
  authDomain: "grease-practicebase.firebaseapp.com",
  projectId: "grease-practicebase",
  storageBucket: "grease-practicebase.firebasestorage.app",
  messagingSenderId: "696484090016",
  appId: "1:696484090016:web:4d7bfe336d842ed946b9c5",
  measurementId: "G-4C78RPXQ99"
};

// ------------------------------
// INIT
// ------------------------------
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


// ------------------------------
// EXPORTS FOR APP.JS
// ------------------------------
export {
  // Auth
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,

  // Firestore
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,

  // Storage
  ref,
  getDownloadURL,
  listAll
};
