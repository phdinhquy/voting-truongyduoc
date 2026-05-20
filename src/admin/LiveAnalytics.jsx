import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function LiveAnalytics() {
  const [posters, setPosters] = useState([]);
  const [votes, setVotes] = useState([]);

  /* ================= REALTIME ================= */
  useEffect(() => {
    const unsubPosters = onSnapshot(collection(db, "posters"), (snap) => {
      setPosters(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    const unsubVotes = onSnapshot(collection(db, "votes"), (snap) => {
      setVotes(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => {
      unsubPosters();
      unsubVotes();
    };
  }, []);

  /* ================= ANALYTICS ================= */

  const totalVotes = votes.length;
  const loginVotes = votes.filter((v) => v.type === "login").length;
  const guestVotes = votes.filter((v) => v.type === "guest").length;

  const voteMap = {};

  votes.forEach((v) => {
    if (!voteMap[v.posterId]) {
      voteMap[v.posterId] = {
        total: 0,
        login: 0,
        guest: 0,
      };
    }

    voteMap[v.posterId].total += 1;

    if (v.type === "login") voteMap[v.posterId].login += 1;
    if (v.type === "guest") voteMap[v.posterId].guest += 1;
  });

  const leaderboard = posters
    .map((p) => ({
      ...p,
      voteCount: voteMap[p.id]?.total || 0,
      loginVotes: voteMap[p.id]?.login || 0,
      guestVotes: voteMap[p.id]?.guest || 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  const topPoster = leaderboard[0];

  /* ================= UI ================= */

  return (
    <div className="admin-dashboard container-fluid py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">📊 Live Voting Analytics</h2>
          <div className="text-muted small">
            Realtime Firestore Dashboard
          </div>
        </div>

        <div className="badge bg-dark px-3 py-2">
          LIVE 🔴
        </div>
      </div>

      {/* KPI */}
      <div className="row g-3 mb-4">

        <div className="col-md-3">
          <div className="kpi-card posters">
            <div className="kpi-title">Poster</div>
            <div className="kpi-value">{posters.length}</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="kpi-card votes">
            <div className="kpi-title">Tổng Vote</div>
            <div className="kpi-value">{totalVotes}</div>
            <div className="kpi-sub">
              👤 {loginVotes} • 👥 {guestVotes}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="kpi-card leader">
            <div className="kpi-title">Dẫn đầu</div>
            <div className="kpi-value-sm">
              {topPoster?.title || "-"}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="kpi-card guest-highlight">
            <div className="kpi-title">Guest Ratio</div>
            <div className="kpi-value">
              {totalVotes ? Math.round((guestVotes / totalVotes) * 100) : 0}%
            </div>
          </div>
        </div>

      </div>

      {/* LEADERBOARD */}
      <div className="leaderboard-card">

        <div className="leaderboard-header">
          🏆 Leaderboard
        </div>

        <div className="table-responsive">

          <table className="table table-hover align-middle mb-0">

            <thead className="table-light">
              <tr>
                <th>Rank</th>
                <th>Poster</th>
                <th>Tác giả</th>
                <th>Total</th>
                <th>Login</th>
                <th>Guest</th>
              </tr>
            </thead>

            <tbody>

              {leaderboard.map((p, index) => (
                <tr key={p.id} className={index === 0 ? "top-1" : ""}>

                  <td className="rank">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `#${index + 1}`}
                  </td>

                  <td className="poster-cell">
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" />
                    )}
                    <div className="poster-title">
                      {p.title}
                    </div>
                  </td>

                  <td className="text-muted">{p.author}</td>

                  <td>
                    <span className="vote-badge total">
                      {p.voteCount}
                    </span>
                  </td>

                  <td>
                    <span className="vote-badge login">
                      {p.loginVotes}
                    </span>
                  </td>

                  <td>
                    <span className="vote-badge guest">
                      {p.guestVotes}
                    </span>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* STYLE */}
      <style>{`
        .admin-dashboard {
          background: #f8fafc;
          min-height: 100vh;
        }

        /* KPI */
        .kpi-card {
          background: white;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          transition: 0.25s ease;
        }

        .kpi-card:hover {
          transform: translateY(-3px);
        }

        .kpi-title {
          font-size: 13px;
          color: #64748b;
        }

        .kpi-value {
          font-size: 28px;
          font-weight: 800;
          margin-top: 6px;
        }

        .kpi-value-sm {
          font-size: 16px;
          font-weight: 600;
          margin-top: 10px;
        }

        .kpi-sub {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .kpi-card.posters { border-left: 4px solid #6366f1; }
        .kpi-card.votes { border-left: 4px solid #22c55e; }
        .kpi-card.leader { border-left: 4px solid #f59e0b; }
        .kpi-card.guest-highlight { border-left: 4px solid #16a34a; }

        /* LEADERBOARD */
        .leaderboard-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }

        .leaderboard-header {
          padding: 14px 18px;
          background: linear-gradient(135deg, #111827, #1f2937);
          color: white;
          font-weight: 600;
        }

        .table-hover tbody tr:hover {
          background: #f8fafc;
        }

        .top-1 {
          background: linear-gradient(90deg, rgba(34,197,94,0.08), transparent);
        }

        .rank {
          font-weight: 700;
          font-size: 16px;
        }

        .poster-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .poster-cell img {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          object-fit: cover;
        }

        .poster-title {
          font-weight: 600;
        }

        .vote-badge {
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
        }

        .vote-badge.total {
          background: #0f172a;
          color: white;
        }

        .vote-badge.login {
          background: #2563eb;
          color: white;
        }

        .vote-badge.guest {
          background: #16a34a;
          color: white;
        }
      `}</style>

    </div>
  );
}