import { logout } from "../services/authService";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {

  const navigate = useNavigate();

  const handleLogout = async () => {

    await logout();

    await Swal.fire({
      icon: "success",
      title: "Đã đăng xuất 👋",
      timer: 1200,
      showConfirmButton: false
    });

    navigate("/admin-login");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🎓 ADMIN DASHBOARD</h1>

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      <h2>Chức năng tiếp theo:</h2>

      <ul>
        <li>⚙️ Cấu hình cuộc thi</li>
        <li>🖼 CRUD Poster</li>
        <li>📊 Live Analytics</li>
        <li>🛡 Anti Cheat</li>
      </ul>
    </div>
  );
}