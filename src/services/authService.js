import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

const provider = new GoogleAuthProvider();

export const loginGoogle = () =>
  signInWithPopup(auth, provider);

export const logout = () =>
  signOut(auth);