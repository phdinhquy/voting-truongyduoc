import { auth, provider } from "../firebase/firebase";
import {
  signInWithPopup,
  signOut
} from "firebase/auth";

import Swal from "sweetalert2";

/*
  EMAIL ADMIN ĐƯỢC PHÉP
*/
const ADMIN_EMAILS = [
  "phdinhquy@gmail.com",
  "ksphdinhquy@gmail.com"
];


/* ======================
   LOGIN GOOGLE
====================== */

export const loginGoogle = async () => {
  try {

    const result = await signInWithPopup(auth, provider);

    const email = result.user.email;

    if (!ADMIN_EMAILS.includes(email)) {

      await signOut(auth);

      Swal.fire({
        icon: "error",
        title: "Không có quyền",
        text: "Email này không phải Admin!"
      });

      return null;
    }

    Swal.fire({
      icon: "success",
      title: "Đăng nhập thành công 🎉",
      timer: 1500,
      showConfirmButton: false
    });

    return result.user;

  } catch (err) {

    Swal.fire({
      icon: "error",
      title: "Login thất bại",
      text: err.message
    });

    console.error(err);
  }
};


/* ======================
   LOGOUT
====================== */

export const logout = async () => {
  await signOut(auth);

  Swal.fire({
    icon: "success",
    title: "Đã đăng xuất 👋",
    timer: 1200,
    showConfirmButton: false
  });
};