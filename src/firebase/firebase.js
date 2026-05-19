import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCGZzBXsJA8J2tU9PAlOu0hYhZrOdXd3m8",
    authDomain: "truongyduoc-minigame-240c1.firebaseapp.com",
    projectId: "truongyduoc-minigame-240c1",
    storageBucket: "truongyduoc-minigame-240c1.firebasestorage.app",
    messagingSenderId: "451497127889",
    appId: "1:451497127889:web:7aef3bd07c983e327d7af0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);