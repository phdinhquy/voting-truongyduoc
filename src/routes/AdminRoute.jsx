import useAdmin from "../hooks/useAdmin";
import { Navigate } from "react-router-dom";

export default function AdminRoute({children}) {

  const {loading,isAdmin} = useAdmin();

  if(loading) return <p>Checking...</p>;

  if(!isAdmin)
    return <Navigate to="/admin-login" />;

  return children;
}