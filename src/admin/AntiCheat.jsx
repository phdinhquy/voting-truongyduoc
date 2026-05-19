import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

import Swal from "sweetalert2";

export default function AntiCheat() {

  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD VOTES ================= */

  const loadVotes = async () => {

    setLoading(true);

    const snap = await getDocs(collection(db, "votes"));

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setVotes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVotes();
  }, []);

  /* ================= DETECT CHEAT ================= */

  const detectCheat = () => {

    const deviceCount = {};
    const ipCount = {};

    votes.forEach(v => {

      if (v.deviceId)
        deviceCount[v.deviceId] =
          (deviceCount[v.deviceId] || 0) + 1;

      if (v.ipHash)
        ipCount[v.ipHash] =
          (ipCount[v.ipHash] || 0) + 1;
    });

    return votes.map(v => ({
      ...v,
      deviceSpam: deviceCount[v.deviceId] > 5,
      ipSpam: ipCount[v.ipHash] > 10
    }));
  };

  const analyzedVotes = detectCheat();

  /* ================= DELETE VOTE ================= */

  const removeVote = async (id) => {

    const confirm = await Swal.fire({
      title: "Xóa vote?",
      icon: "warning",
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    await deleteDoc(doc(db, "votes", id));

    Swal.fire("Đã xoá vote");

    loadVotes();
  };

  /* ================= CLEAR SPAM ================= */

  const clearSpamVotes = async () => {

    const confirm = await Swal.fire({
      title: "Xóa toàn bộ vote nghi gian lận?",
      icon: "warning",
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    const spamVotes = analyzedVotes.filter(
      v => v.deviceSpam || v.ipSpam
    );

    for (const v of spamVotes) {
      await deleteDoc(doc(db, "votes", v.id));
    }

    Swal.fire("Đã dọn spam 🎯");

    loadVotes();
  };

  /* ================= UI ================= */

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border"/>
      </div>
    );

  return (
    <div className="container py-4">

      <h2 className="fw-bold mb-4">
        🛡 Anti Cheat System
      </h2>

      <button
        className="btn btn-danger mb-3"
        onClick={clearSpamVotes}
      >
        🚨 Xóa toàn bộ vote nghi gian lận
      </button>

      <div className="table-responsive">

        <table className="table table-bordered table-hover">

          <thead className="table-dark">
            <tr>
              <th>Poster</th>
              <th>User</th>
              <th>Device</th>
              <th>IP</th>
              <th>Thời gian</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {analyzedVotes.map(v => (

              <tr
                key={v.id}
                className={
                  v.deviceSpam || v.ipSpam
                    ? "table-danger"
                    : ""
                }
              >

                <td>{v.posterId}</td>
                <td>{v.userId}</td>
                <td>{v.deviceId}</td>
                <td>{v.ipHash}</td>

                <td>
                  {v.createdAt?.seconds
                    ? new Date(
                        v.createdAt.seconds * 1000
                      ).toLocaleString()
                    : "-"
                  }
                </td>

                <td>
                  {v.deviceSpam && "⚠ Device Spam "}
                  {v.ipSpam && "⚠ IP Spam"}
                </td>

                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeVote(v.id)}
                  >
                    Xóa
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}