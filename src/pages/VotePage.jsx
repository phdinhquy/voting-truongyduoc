import { useEffect, useState } from "react";
import { db, auth } from "../firebase/firebase";
import "../styles/vote.css";

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

export default function VotePage() {

  /* ================= STATE ================= */
  const [user, setUser] = useState(null);
  const [contest, setContest] = useState(null);
  const [posters, setPosters] = useState([]);
  const [selectedPosters, setSelectedPosters] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  /* ================= NEW STATE ================= */
  const [nowAllowed, setNowAllowed] = useState(false);
  const [voteStatusText, setVoteStatusText] = useState("");

  /* ================= AUTH ================= */
  useEffect(() => {
    return auth.onAuthStateChanged(u => setUser(u));
  }, []);

  /* ================= CONTEST ================= */
  useEffect(() => {
    return onSnapshot(
      doc(db, "config", "contest"),
      snap => setContest(snap.data())
    );
  }, []);

  /* ================= POSTERS ================= */
  useEffect(() => {
    return onSnapshot(
      collection(db, "posters"),
      snap => {
        setPosters(
          snap.docs.map(d => ({ id: d.id, ...d.data() }))
        );
      }
    );
  }, []);

  /* ================= LOAD USER VOTE ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "votes"),
      where("uid", "==", user.uid)
    );

    getDocs(q).then(snap => {
      const votedIds = snap.docs.map(d => d.data().posterId);

      setSelectedPosters(votedIds);
      setHasVoted(votedIds.length > 0);
    });

  }, [user]);

  /* ================= RESET ================= */
  useEffect(() => {
    if (!user) {
      setSelectedPosters([]);
      setHasVoted(false);
    }
  }, [user]);

  /* ================= TIME CHECK ================= */
  useEffect(() => {
    if (!contest) return;

    const now = Date.now();
    const start = contest.startTime?.toDate?.().getTime?.() || 0;
    const end = contest.endTime?.toDate?.().getTime?.() || 0;

    if (!contest.isActive) {
      setNowAllowed(false);
      setVoteStatusText("⛔ Cuộc thi chưa kích hoạt");
      return;
    }

    if (now < start) {
      setNowAllowed(false);
      setVoteStatusText("⏳ Chưa đến thời gian bình chọn");
      return;
    }

    if (now > end) {
      setNowAllowed(false);
      setVoteStatusText("⛔ Đã kết thúc bình chọn");
      return;
    }

    setNowAllowed(true);
    setVoteStatusText("🟢 Đang trong thời gian bình chọn");

  }, [contest]);

  /* ================= USER TYPE ================= */
  const getUserType = () => {
    if (!user?.email) return "guest";

    if (
      user.email.endsWith("@smp.und.vn") ||
      user.email.endsWith("@st.smp.udn.vn")
    ) {
      return "internal";
    }

    return "guest";
  };

  const getMaxVote = () => {
    if (!contest) return 0;

    return getUserType() === "internal"
      ? contest.maxVoteInternal
      : contest.maxVoteGuest;
  };

  /* ================= TOGGLE ================= */
  const togglePoster = (poster) => {

    if (!user || hasVoted || submitting || !nowAllowed) return;

    const exists = selectedPosters.includes(poster.id);

    if (exists) {
      setSelectedPosters(prev => prev.filter(id => id !== poster.id));
      return;
    }

    if (selectedPosters.length >= getMaxVote()) {
      Swal.fire(`Chỉ được chọn tối đa ${getMaxVote()} poster`);
      return;
    }

    setSelectedPosters(prev => [...prev, poster.id]);
  };

  /* ================= SUBMIT ================= */
  const submitVote = async () => {

    if (!user) return Swal.fire("Chưa đăng nhập");
    if (!nowAllowed) return Swal.fire("Ngoài thời gian bình chọn");
    if (selectedPosters.length === 0) return Swal.fire("Bạn chưa chọn poster");
    if (submitting) return;

    const confirm = await Swal.fire({
      title: "Xác nhận bình chọn?",
      html: `Bạn đã chọn <b>${selectedPosters.length}</b> poster`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận"
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);

    try {

      for (const posterId of selectedPosters) {

        await addDoc(collection(db, "votes"), {
          uid: user.uid,
          email: user.email,
          posterId,
          createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, "posters", posterId), {
          voteCount: increment(1)
        });

      }

      Swal.fire("Vote thành công 🎉", "", "success");

      setHasVoted(true);
      setSelectedPosters([]);

    } catch (e) {
      Swal.fire("Vote lỗi", e.message, "error");
    }

    setSubmitting(false);
  };

  /* ================= SHARE ================= */
  const shareFacebook = (poster) => {

    const baseUrl = "https://voting-truongyduoc.vercel.app";
    const url = `${baseUrl}/poster/${poster.id}`;

    window.open(
      "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(url),
      "_blank",
      "width=600,height=500"
    );
  };

  /* ================= FILTER ================= */
  const filteredPosters = posters.filter(p =>
    (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.author || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ================= 🔒 SECURITY ADD-ON (NEW - ONLY ADD) ================= */

  // 1. Chặn F12 / Ctrl+U / Ctrl+Shift+I,J,C
  useEffect(() => {
    const blockKeys = (e) => {
      if (e.key === "F12") e.preventDefault();

      if (
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", blockKeys);
    return () => window.removeEventListener("keydown", blockKeys);
  }, []);

  // 2. Chặn chuột phải
  useEffect(() => {
    const blockContext = (e) => e.preventDefault();
    document.addEventListener("contextmenu", blockContext);

    return () => document.removeEventListener("contextmenu", blockContext);
  }, []);

  // 3. Detect DevTools mở (mức cơ bản)
  useEffect(() => {
    const detect = setInterval(() => {
      const threshold = 160;

      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        document.body.innerHTML =
          "<h2 style='text-align:center;margin-top:20%'>⚠️ DevTools detected</h2>";
      }
    }, 1000);

    return () => clearInterval(detect);
  }, []);

  /* ================= UI ================= */
  return (
    <div className="container-fluid bg-light min-vh-100 py-4">

{/* ================= HEADER ================= */}
<div className="container mb-4">
  <div className="card shadow-sm border-0">
    <div className="card-body">

      {/* ROW 1 */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <img src="/logo.png" style={{ width: 52, height: 52 }} />
        <div>
            <div className="text-muted small">
            <h5>TRƯỜNG Y DƯỢC - ĐẠI HỌC ĐÀ NẴNG</h5>
          </div>
          <h6 className="fw-bold mb-0 text-primary">
            {contest?.title || "Poster Voting System"}
          </h6>

        </div>
      </div>

      {/* ROW 2 */}
      <div className="alert alert-light border d-flex justify-content-between mb-3">
        <div>
          <b>Có</b> {posters.length} poster
        </div>
        <div>
          Quy định: 1 người vote 1 lần, được phép chọn nhiều poster.
        </div>
      </div>

      {/* ROW 2.5 STATUS TIME */}
      <div className="alert alert-info d-flex justify-content-between mb-3">
        <div>
          🕒 {voteStatusText}
        </div>
        <div>
          {contest?.startTime && contest?.endTime && (
            <>
              {new Date(contest.startTime.toDate()).toLocaleString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
})}
→
{new Date(contest.endTime.toDate()).toLocaleString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
})}
            </>
          )}
        </div>
      </div>

      {/* ROW 3 */}
      <div className="d-flex justify-content-between flex-wrap gap-2">

        <div className="text-muted small">
          {user
            ? hasVoted
              ? "Đã vote"
              : nowAllowed
                ? "Đang mở vote"
                : "Ngoài thời gian vote"
            : "Chưa đăng nhập. Để được bình chọn, hãy đăng nhập."}
        </div>

        <div className="d-flex gap-2">
          {!user ? (
            <>
              <button className="btn btn-danger" onClick={loginGoogle}>Tài khoản Google</button>
              <button className="btn btn-primary" onClick={loginMicrosoft}>Tài khoản Microsoft 365 của UD-SMP</button>
            </>
          ) : (
            <>
              <div className="small text-end me-2">{user.email}</div>
              <button className="btn btn-outline-dark btn-sm" onClick={logoutUser}>
                Logout
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  </div>
</div>

{/* SEARCH */}
{user && (
  <div className="container mb-3">
    <input
      className="form-control"
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Tìm poster..."
    />
  </div>
)}

{/* STATUS BAR */}
{user && (
  <div className="container mb-3">
    <div className="alert alert-success d-flex justify-content-between">
      <div>
        Đã chọn <b>{selectedPosters.length}</b> / 11 poster
      </div>
      {hasVoted && <span className="badge bg-secondary">Đã vote</span>}
    </div>
  </div>
)}

{/* GRID (KHÔNG MẤT GÌ) */}
<div className="container">
  <div className="row g-4">

    {filteredPosters.map(p => {

      const selected = selectedPosters.includes(p.id);

      return (
        <div key={p.id} className="col-xl-3 col-lg-4 col-md-6">

          <div
            className={`card h-100 shadow-sm border-0 ${selected ? "border-success" : ""}`}
            onClick={() => togglePoster(p)}
            style={{ cursor: "pointer" }}
          >

            <img src={p.imageUrl} className="card-img-top" style={{ height: 240, objectFit: "cover" }} />

            <div className="card-body text-center">

              <h6 className="fw-bold">{p.title}</h6>
              <small className="text-muted">{p.author}</small>

              <div className="text-danger fw-bold mt-2">
                ❤️ {p.voteCount || 0}
              </div>

              {user && !hasVoted && nowAllowed && (
                <button className={`btn w-100 mt-2 ${selected ? "btn-success" : "btn-outline-success"}`}>
                  {selected ? "Đã chọn" : "Chọn"}
                </button>
              )}

              <button
                className="btn btn-primary w-100 mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  shareFacebook(p);
                }}
              >
                📤 Share
              </button>

            </div>
          </div>

        </div>
      );
    })}

  </div>
</div>

{/* FLOAT BAR (GIỮ NGUYÊN 100%) */}
{user && !hasVoted && selectedPosters.length > 0 && (
  <div className="vote-bar shadow-lg">
    <div className="container d-flex justify-content-between align-items-center">

      <div>
        Đã chọn <b>{selectedPosters.length}</b>/ 11 poster
      </div>

      <button
        className="btn btn-primary"
        disabled={submitting || !nowAllowed}
        onClick={submitVote}
      >
        XÁC NHẬN VOTE
      </button>

    </div>
  </div>
)}

    </div>
  );
}