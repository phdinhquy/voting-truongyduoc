import { useEffect } from "react";
import {
  loginGoogle,
  handleRedirectLogin
} from "../services/authService";

export default function AdminLogin() {

  useEffect(() => {
    handleRedirectLogin();
  }, []);

  return (
    <div style={{ textAlign:"center", marginTop:100 }}>
      <h1>ADMIN LOGIN</h1>

      <button onClick={loginGoogle}>
        Login Google
      </button>
    </div>
  );
}