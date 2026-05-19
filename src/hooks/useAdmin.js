import { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function useAdmin() {

  const [user,setUser] = useState(null);
  const [isAdmin,setIsAdmin] = useState(false);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    return onAuthStateChanged(auth, async(u)=>{

      if(!u){
        setLoading(false);
        return;
      }

      setUser(u);

      const ref = doc(db,"admins",u.email);
      const snap = await getDoc(ref);

      setIsAdmin(snap.exists());
      setLoading(false);
    });

  },[]);

  return {user,isAdmin,loading};
}