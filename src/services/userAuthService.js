import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider, // ⭐ NEW
  signOut
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import Swal from "sweetalert2";

const google = new GoogleAuthProvider();
const microsoft = new OAuthProvider("microsoft.com");
const facebook = new FacebookAuthProvider(); // ⭐ NEW

/* ================= GOOGLE ================= */
export const loginGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, google);

    Swal.fire({
      icon: "success",
      title: "Đăng nhập Google thành công"
    });

    return res.user;
  } catch (e) {
    Swal.fire("Login lỗi", e.message, "error");
  }
};

/* ================= MICROSOFT ================= */
export const loginMicrosoft = async () => {
  try {
    const res = await signInWithPopup(auth, microsoft);

    const email = res.user.email;

    if (
      !email.endsWith("@smp.udn.vn") &&
      !email.endsWith("@st.smp.udn.vn")
    ) {
      await signOut(auth);

      Swal.fire(
        "Không hợp lệ",
        "Chỉ tài khoản SMP được phép",
        "error"
      );
      return null;
    }

    return res.user;
  } catch (e) {
    Swal.fire("Login lỗi", e.message, "error");
  }
};

/* ================= FACEBOOK ⭐ NEW ================= */
export const loginFacebook = async () => {
  try {
    const res = await signInWithPopup(auth, facebook);

    Swal.fire({
      icon: "success",
      title: "Đăng nhập Facebook thành công"
    });

    return res.user;
  } catch (e) {
    Swal.fire("Login Facebook lỗi", e.message, "error");
  }
};

/* ================= LOGOUT ================= */
export const logoutUser = () => signOut(auth);