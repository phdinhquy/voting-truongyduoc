import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import Swal from "sweetalert2";
import "./admin.css";

export default function AdminLayout() {

  const navigate = useNavigate();

  /* ================= LOGOUT ================= */

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

  /* ================= UI ================= */

  return (
    <div className="d-flex">

      {/* ================= SIDEBAR ================= */}
      <aside
        className="bg-dark text-white p-3"
        style={{
          width: "260px",
          minHeight: "100vh"
        }}
      >

        <h4 className="fw-bold mb-4 text-center">
          🎓 SMP ADMIN
        </h4>

        <nav className="nav flex-column gap-2">

          <NavLink to="/admin" end className="admin-link">
            <i className="bi bi-speedometer2 me-2"/>
            Dashboard
          </NavLink>

          <NavLink to="/admin/contest" className="admin-link">
            <i className="bi bi-gear me-2"/>
            Contest Config
          </NavLink>

          <NavLink to="/admin/posters" className="admin-link">
            <i className="bi bi-image me-2"/>
            Poster Manager
          </NavLink>

          <NavLink to="/admin/live" className="admin-link">
            <i className="bi bi-graph-up me-2"/>
            Live Analytics
          </NavLink>

          <NavLink to="/admin/anticheat" className="admin-link">
            <i className="bi bi-shield-check me-2"/>
            Anti Cheat
          </NavLink>

        </nav>

        <hr className="my-4"/>

        <button
          className="btn btn-danger w-100"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2"/>
          Logout
        </button>

      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh" }}
      >

        {/* TOP BAR */}
        <div className="bg-white shadow-sm p-3 mb-4">

          <h5 className="m-0 fw-bold text-primary">
            Poster Voting Management System
          </h5>

        </div>

        {/* PAGE CONTENT */}
        <div className="container-fluid px-4">
          <Outlet />
        </div>

      </main>

    </div>
  );
}