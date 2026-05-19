import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./routes/AdminRoute";

export default function App(){

  return(
    <BrowserRouter>

      <Routes>

        <Route path="/admin-login" element={<AdminLogin/>}/>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard/>
            </AdminRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}