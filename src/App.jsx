import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLogin from "./admin/AdminLogin";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import ContestConfig from "./admin/ContestConfig";
import PosterManager from "./admin/PosterManager";
import LiveAnalytics from "./admin/LiveAnalytics";
import AntiCheat from "./admin/AntiCheat";
import AdminRoute from "./admin/AdminRoute";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* PROTECTED ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >

          <Route index element={<AdminDashboard />} />
          <Route path="contest" element={<ContestConfig />} />
          <Route path="posters" element={<PosterManager />} />
          <Route path="live" element={<LiveAnalytics />} />
          <Route path="anticheat" element={<AntiCheat />} />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;