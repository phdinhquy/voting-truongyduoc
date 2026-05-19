import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";

import { auth } from "../firebase/firebase";

const provider = new GoogleAuthProvider();

export const loginGoogle = () =>
  signInWithRedirect(auth, provider);

export const handleRedirectLogin = () =>
  getRedirectResult(auth);