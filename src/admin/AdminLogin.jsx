import { loginGoogle } from "../services/authService";

export default function AdminLogin() {

  const handleLogin = async () => {
    await loginGoogle();
  };

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>

      <h1>🎓 ADMIN LOGIN</h1>

      <button onClick={handleLogin}>
        Login with Google
      </button>

    </div>
  );
}