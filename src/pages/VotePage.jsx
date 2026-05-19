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
  loginFacebook, // ⭐ NEW
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

  const [comments, setComments] = useState([]); // ⭐ NEW
  const [commentInput, setCommentInput] = useState({}); // ⭐ NEW per poster

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  /* ================= CONTEST ================= */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "contest"), (snap) => {
      setContest(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, []);

  /* ================= POSTERS ================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "posters"), (snap) => {
      setPosters(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  /* ================= COMMENTS (NEW) ================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "comments"), (snap) => {
      setComments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, []);

  /* ================= CHECK VOTE ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "votes"), where("uid", "==", user.uid));

    getDocs(q).then((snap) => {
      setHasVoted(!snap.empty);
    });
  }, [user]);

  /* ================= USER TYPE ================= */
  const userType =
    user?.email?.endsWith("@smp.und.vn") ||
    user?.email?.endsWith("@st.smp.udn.vn")
      ? "internal"
      : "guest";

  const maxVote = contest
    ? userType === "internal"
      ? contest.maxVoteInternal
      : contest.maxVoteGuest
    : 0;

  /* ================= TOGGLE ================= */
  const togglePoster = (posterId) => {
    if (hasVoted || submitting) return;

    setSelectedPosters((prev) => {
      const exists = prev.includes(posterId);

      if (exists) return prev.filter((id) => id !== posterId);

      if (prev.length >= maxVote) {
        Swal.fire(`Chỉ được chọn tối đa ${maxVote} poster`);
        return prev;
      }

      return [...prev, posterId];
    });
  };

  /* ================= SUBMIT VOTE ================= */
  const submitVote = async () => {
    if (!user) return Swal.fire("Chưa đăng nhập");
    if (selectedPosters.length === 0)
      return Swal.fire("Bạn chưa chọn poster");
    if (submitting) return;

    const confirm = await Swal.fire({
      title: "Xác nhận bình chọn?",
      html: `Bạn đã chọn <b>${selectedPosters.length}</b> poster`,
      showCancelButton: true,
      confirmButtonText: "Xác nhận vote"
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);

    try {
      await Promise.all(
        selectedPosters.map(async (posterId) => {
          await addDoc(collection(db, "votes"), {
            uid: user.uid,
            email: user.email,
            posterId,
            createdAt: serverTimestamp()
          });

          await updateDoc(doc(db, "posters", posterId), {
            voteCount: increment(1)
          });
        })
      );

      Swal.fire("Vote thành công 🎉", "", "success");

      setHasVoted(true);
      setSelectedPosters([]);
    } catch (e) {
      Swal.fire("Vote lỗi", e.message, "error");
    }

    setSubmitting(false);
  };

  /* ================= COMMENT SUBMIT (NEW) ================= */
  const submitComment = async (posterId) => {
    if (!user) return Swal.fire("Chưa đăng nhập");

    const text = commentInput[posterId];
    if (!text) return;

    await addDoc(collection(db, "comments"), {
      posterId,
      uid: user.uid,
      email: user.email,
      text,
      createdAt: serverTimestamp()
    });

    setCommentInput((prev) => ({ ...prev, [posterId]: "" }));
  };

  /* ================= FACEBOOK SHARE (NEW) ================= */
  const shareFacebook = (poster) => {
    const url = encodeURIComponent(
      `${window.location.origin}?poster=${poster.id}`
    );

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank"
    );
  };

  /* ================= UI ================= */
  return (
    <div className="container-fluid bg-light min-vh-100 py-4">

      {/* HEADER */}
      <div className="container mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <h3 className="fw-bold mb-1">
                  🏆 {contest?.title}
                </h3>
              </div>

              <div className="col-lg-6 text-lg-end mt-3 mt-lg-0">

                {!user ? (
                  <>
                    <button className="btn btn-danger me-2" onClick={loginGoogle}>
                      Google
                    </button>

                    <button className="btn btn-primary me-2" onClick={loginMicrosoft}>
                      SMP
                    </button>

                    {/* ⭐ FACEBOOK LOGIN */}
                    <button className="btn btn-info text-white" onClick={loginFacebook}>
                      Facebook
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-2">
                      <b>{user.email}</b>
                    </div>

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

      {/* STATUS */}
      <div className="container mb-3">
        <div className="alert alert-success d-flex justify-content-between">
          <div>
            ✅ Đã chọn <b>{selectedPosters.length}</b> / {maxVote}
          </div>

          {hasVoted && (
            <span className="badge bg-secondary">Đã vote</span>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="container">
        <div className="row g-4">

          {posters.map((p) => {
            const selected = selectedPosters.includes(p.id);
            const posterComments = comments.filter(c => c.posterId === p.id);

            return (
              <div key={p.id} className="col-xl-3 col-lg-4 col-md-6">

                <div className={`card shadow-sm h-100 ${selected ? "border-success" : ""}`}>

                  <img src={p.imageUrl} className="card-img-top" style={{ height: 260, objectFit: "cover" }} />

                  <div className="card-body">

                    <h6 className="fw-bold">{p.title}</h6>
                    <small className="text-muted">{p.author}</small>

                    <div className="fw-bold text-danger mt-1">
                      ❤️ {p.voteCount || 0}
                    </div>

                    {/* SHARE BUTTON ⭐ */}
                    <button
                      className="btn btn-sm btn-primary w-100 mt-2"
                      onClick={() => shareFacebook(p)}
                    >
                      Share Facebook
                    </button>

                    {/* VOTE */}
                    {!hasVoted && user && (
                      <button
                        className={`btn w-100 mt-2 ${selected ? "btn-success" : "btn-outline-success"}`}
                        onClick={() => togglePoster(p.id)}
                      >
                        {selected ? "Đã chọn" : "Chọn"}
                      </button>
                    )}

                    {/* COMMENTS ⭐ */}
                    <div className="mt-3">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Viết bình luận..."
                        value={commentInput[p.id] || ""}
                        onChange={(e) =>
                          setCommentInput({
                            ...commentInput,
                            [p.id]: e.target.value
                          })
                        }
                      />

                      <button
                        className="btn btn-sm btn-dark w-100 mt-1"
                        onClick={() => submitComment(p.id)}
                      >
                        Gửi
                      </button>

                      <div className="mt-2 small">
                        {posterComments.slice(-3).map((c) => (
                          <div key={c.id} className="border-bottom py-1">
                            <b>{c.email}</b>: {c.text}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* FLOAT BAR */}
      {user && !hasVoted && selectedPosters.length > 0 && (
        <div className="vote-bar shadow-lg">
          <div className="container d-flex justify-content-between">
            <div>Đã chọn <b>{selectedPosters.length}</b></div>

            <button
              className="btn btn-primary"
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