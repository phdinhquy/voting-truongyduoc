import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// =======================
// FIREBASE CONFIG
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyDuV04NNLGWammfRN6D9gMvYBDFAX8TiWg",
  authDomain: "tyd-portal.firebaseapp.com",
  projectId: "tyd-portal",
  storageBucket: "tyd-portal.firebasestorage.app",
  messagingSenderId: "224925324935",
  appId: "1:224925324935:web:98534d49d4e8433663ca22"
};

// =======================
// INIT APP
// =======================
const app = initializeApp(firebaseConfig);

// =======================
// AUTH
// =======================
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// =======================
// DATABASE
// =======================
export const db = getFirestore(app);
export const storage = getStorage(app);