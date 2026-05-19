import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot
} from "firebase/firestore";

export default function LiveAnalytics() {

  const [posters, setPosters] = useState([]);
  const [votes, setVotes] = useState([]);

  /* ================= REALTIME POSTERS ================= */

  useEffect(() => {

    const unsubPosters = onSnapshot(
      collection(db, "posters"),
      snap => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setPosters(data);
      }
    );

    const unsubVotes = onSnapshot(
      collection(db, "votes"),
      snap => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setVotes(data);
      }
    );

    return () => {
      unsubPosters();
      unsubVotes();
    };

  }, []);

  /* ================= CALCULATE ================= */

  const totalVotes = votes.length;

  const voteMap = {};

  votes.forEach(v => {
    voteMap[v.posterId] =
      (voteMap[v.posterId] || 0) + 1;
  });

  const leaderboard = posters
    .map(p => ({
      ...p,
      voteCount: voteMap[p.id] || 0
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  /* ================= UI ================= */

  return (
    <div className="container-fluid py-4">

      <h2 className="fw-bold mb-4">
        📊 Live Voting Analytics
      </h2>

      {/* ================= STATS ================= */}

      <div className="row mb-4">

        <div className="col-md-4 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Tổng Poster</h5>
              <h2>{posters.length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Tổng Vote</h5>
              <h2 className="text-success">
                {totalVotes}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow text-center">
            <div className="card-body">
              <h5>Poster dẫn đầu</h5>
              <h6>
                {leaderboard[0]?.title || "-"}
              </h6>
            </div>
          </div>
        </div>

      </div>

      {/* ================= LEADERBOARD ================= */}

      <div className="card shadow">

        <div className="card-header bg-dark text-white">
          🏆 Leaderboard
        </div>

        <div className="table-responsive">

          <table className="table table-hover align-middle mb-0">

            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Poster</th>
                <th>Tác giả</th>
                <th>Vote</th>
              </tr>
            </thead>

            <tbody>

              {leaderboard.map((p, index) => (

                <tr key={p.id}>

                  <td>
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && index + 1}
                  </td>

                  <td className="d-flex align-items-center gap-3">

                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt=""
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 8
                        }}
                      />
                    )}

                    <b>{p.title}</b>

                  </td>

                  <td>{p.author}</td>

                  <td>
                    <span className="badge bg-success fs-6">
                      {p.voteCount}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}