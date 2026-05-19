import { loginGoogle } from "../services/authService";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AdminLogin() {

  const navigate = useNavigate();

  const handleLogin = async () => {

    try {

      await loginGoogle();

      await Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công 🎉",
        timer: 1500,
        showConfirmButton: false
      });

      navigate("/admin");

    } catch (err) {

      if (err.message === "not-admin") {
        Swal.fire("Không có quyền", "Email không phải Admin", "error");
        return;
      }

      Swal.fire("Login lỗi", err.message, "error");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>🎓 Admin Login</h1>

      <button onClick={handleLogin}>
        Login with Google
      </button>
    </div>
  );
}