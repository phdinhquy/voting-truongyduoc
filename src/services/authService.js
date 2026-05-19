import { auth, provider } from "../firebase/firebase";
import {
  signInWithPopup,
  signOut
} from "firebase/auth";

/* ADMIN EMAIL */
const ADMIN_EMAILS = [
  "phdinhquy@gmail.com",
  "ksphdinhquy@gmail.com"
];

/* =================
   LOGIN GOOGLE
================= */
export const loginGoogle = async () => {

  const result = await signInWithPopup(auth, provider);

  const email = result.user.email;

  if (!ADMIN_EMAILS.includes(email)) {
    await signOut(auth);
    throw new Error("not-admin");
  }

  return result.user;
};

/* =================
   LOGOUT
================= */
export const logout = async () => {
  await signOut(auth);
};