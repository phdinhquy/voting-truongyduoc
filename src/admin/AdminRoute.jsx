import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {

  const [user, setUser] = useState(undefined);

  useEffect(() => {

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();

  }, []);

  if (user === undefined)
    return <h3>Loading...</h3>;

  if (!user)
    return <Navigate to="/admin-login" />;

  return children;
}