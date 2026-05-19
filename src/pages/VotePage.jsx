import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";

import {
  collection,
  onSnapshot,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";

import {
  loginGoogle,
  loginMicrosoft,
  logoutUser
} from "../services/userAuthService";

import Swal from "sweetalert2";

export default function VotePage(){

/* ================= STATE ================= */

const [user,setUser]=useState(null);
const [contest,setContest]=useState(null);
const [posters,setPosters]=useState([]);
const [selectedPosters,setSelectedPosters]=useState([]);
const [hasVoted,setHasVoted]=useState(false);
const [submitting,setSubmitting]=useState(false);

/* ================= AUTH ================= */

useEffect(()=>{
  return auth.onAuthStateChanged(u=>setUser(u));
},[]);

/* ================= CONTEST ================= */

useEffect(()=>{
  return onSnapshot(
    doc(db,"config","contest"),
    snap=>setContest(snap.data())
  );
},[]);

/* ================= POSTERS ================= */

useEffect(()=>{
  return onSnapshot(
    collection(db,"posters"),
    snap=>{
      setPosters(
        snap.docs.map(d=>({id:d.id,...d.data()}))
      );
    }
  );
},[]);

/* ================= CHECK USER VOTED ================= */

useEffect(()=>{

if(!user) return;

const q=query(
  collection(db,"votes"),
  where("uid","==",user.uid)
);

getDocs(q).then(snap=>{
  setHasVoted(!snap.empty);
});

},[user]);

/* ================= USER TYPE ================= */

const getUserType=()=>{

if(!user?.email) return "guest";

if(
user.email.endsWith("@smp.und.vn")||
user.email.endsWith("@st.smp.udn.vn")
){
return "internal";
}

return "guest";
};

const getMaxVote=()=>{
if(!contest) return 0;

return getUserType()==="internal"
? contest.maxVoteInternal
: contest.maxVoteGuest;
};

/* ================= SELECT POSTER ================= */

const togglePoster=(poster)=>{

if(hasVoted) return;

const exists=selectedPosters.includes(poster.id);

if(exists){
setSelectedPosters(prev=>prev.filter(id=>id!==poster.id));
return;
}

if(selectedPosters.length>=getMaxVote()){
Swal.fire(
`Chỉ được chọn tối đa ${getMaxVote()} poster`
);
return;
}

setSelectedPosters(prev=>[...prev,poster.id]);
};

/* ================= CONFIRM VOTE ================= */

const submitVote=async()=>{

if(!user){
Swal.fire("Chưa đăng nhập");
return;
}

if(selectedPosters.length===0){
Swal.fire("Bạn chưa chọn poster");
return;
}

const confirm=await Swal.fire({
title:"Xác nhận bình chọn?",
html:`Bạn đã chọn <b>${selectedPosters.length}</b> poster`,
showCancelButton:true,
confirmButtonText:"Xác nhận vote"
});

if(!confirm.isConfirmed) return;

setSubmitting(true);

try{

for(const posterId of selectedPosters){

await addDoc(collection(db,"votes"),{
uid:user.uid,
email:user.email,
posterId,
createdAt:serverTimestamp()
});

await updateDoc(
doc(db,"posters",posterId),
{voteCount:increment(1)}
);

}

Swal.fire("Vote thành công 🎉","","success");

setHasVoted(true);
setSelectedPosters([]);

}catch(e){
Swal.fire("Vote lỗi",e.message,"error");
}

setSubmitting(false);
};

/* ================= UI ================= */

return(
<div className="container py-4">

<h1 className="text-center mb-4">
🏆 {contest?.title}
</h1>

{/* LOGIN */}

{!user &&(

<div className="text-center mb-4">

<button
className="btn btn-danger me-3"
onClick={loginGoogle}
>
Khách (Google)
</button>

<button
className="btn btn-primary"
onClick={loginMicrosoft}
>
SMP Login
</button>

</div>
)}

{/* USER INFO */}

{user&&(
<div className="d-flex justify-content-between mb-3">

<div>

<b>{user.email}</b><br/>

Loại:
{getUserType()==="internal"
?" Thành viên SMP"
:" Khách"}

</div>

<button
className="btn btn-dark"
onClick={logoutUser}
>
Logout
</button>

</div>
)}

{/* SELECTED LIST */}

{selectedPosters.length>0 &&(

<div className="alert alert-success">

✅ Đã chọn {selectedPosters.length}/{getMaxVote()} poster

</div>
)}

{/* POSTERS */}

<div className="row">

{posters.map(p=>{

const selected=
selectedPosters.includes(p.id);

return(

<div key={p.id} className="col-lg-4 mb-4">

<div
className={`card h-100 shadow
${selected?"border-success border-3":""}`}
>

<img
src={p.imageUrl}
className="card-img-top"
style={{height:260,objectFit:"cover"}}
/>

<div className="card-body">

<h5>{p.title}</h5>

<p>👨‍🎓 {p.author}</p>

<h4>❤️ {p.voteCount||0}</h4>

{user&&!hasVoted&&(

<button
className={
selected
?"btn btn-success w-100"
:"btn btn-outline-success w-100"
}
onClick={()=>togglePoster(p)}
>
{selected?"Đã chọn":"Chọn"}
</button>

)}

{hasVoted&&(
<button
className="btn btn-secondary w-100"
disabled
>
Đã bình chọn
</button>
)}

</div>
</div>
</div>

);

})}

</div>

{/* SUBMIT */}

{user&&!hasVoted&&(

<div className="text-center mt-4">

<button
className="btn btn-lg btn-primary"
disabled={submitting}
onClick={submitVote}
>
XÁC NHẬN BÌNH CHỌN
</button>

</div>
)}

</div>
);
}