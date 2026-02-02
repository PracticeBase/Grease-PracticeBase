// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAecPf2aXR0j1buuDmz9MVrS8aYINs1eCU",
  authDomain: "grease-practicebase.firebaseapp.com",
  projectId: "grease-practicebase",
  storageBucket: "grease-practicebase.firebasestorage.app",
  messagingSenderId: "696484090016",
  appId: "1:696484090016:web:4d7bfe336d842ed946b9c5",
  measurementId: "G-4C78RPXQ99"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAILS = ["admin@example.com"];

export {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  ADMIN_EMAILS
};
