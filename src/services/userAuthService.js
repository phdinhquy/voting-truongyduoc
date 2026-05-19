import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import Swal from "sweetalert2";

const google = new GoogleAuthProvider();
const microsoft = new OAuthProvider("microsoft.com");

export const loginGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, google);

    Swal.fire({
      icon: "success",
      title: "Đăng nhập thành công"
    });

    return res.user;
  } catch (e) {
    Swal.fire("Login lỗi", e.message, "error");
  }
};

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

export const logoutUser = () => signOut(auth);