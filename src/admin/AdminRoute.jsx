import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase";

const ADMIN_EMAILS = [
  "phdinhquy@gmail.com",
  "ksphdinhquy@gmail.com"
];

export default function AdminRoute({ children }) {

  const [user,setUser]=useState(undefined);

  useEffect(()=>{

    const unsub = auth.onAuthStateChanged(u=>{
      setUser(u);
    });

    return ()=>unsub();

  },[]);

  if(user===undefined) return <div>Loading...</div>;

  if(!user || !ADMIN_EMAILS.includes(user.email))
    return <Navigate to="/admin-login" />;

  return children;
}