import { logout } from "../services/authService";

export default function AdminDashboard(){

  return(
    <div>

      <h1>🎓 ADMIN DASHBOARD</h1>

      <button onClick={logout}>
        Logout
      </button>

      <hr/>

      <h2>Chức năng sẽ build tiếp:</h2>

      <ul>
        <li>⚙️ Cấu hình cuộc thi</li>
        <li>🖼 CRUD Poster</li>
        <li>📊 Live Dashboard</li>
        <li>🛡 Anti Cheat</li>
      </ul>

    </div>
  );
}