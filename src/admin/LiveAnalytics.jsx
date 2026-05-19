import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export default function LiveAnalytics() {

  const [players, setPlayers] = useState([]);
  const [answers, setAnswers] = useState([]);

  const GAME_ID = "default"; // đổi sau

  useEffect(() => {

    // realtime players
    const unsubPlayers = onSnapshot(
      collection(db, "games", GAME_ID, "players"),
      snap => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setPlayers(data);
      }
    );

    // realtime answers
    const q = query(
      collection(db, "games", GAME_ID, "answers"),
      orderBy("createdAt", "desc")
    );

    const unsubAnswers = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setAnswers(data);
    });

    return () => {
      unsubPlayers();
      unsubAnswers();
    };

  }, []);

  const totalPlayers = players.length;

  const correctAnswers =
    answers.filter(a => a.correct === true).length;

  return (
    <div>

      <h2>📊 LIVE ANALYTICS</h2>

      <hr />

      <h3>👥 Players Online: {totalPlayers}</h3>
      <h3>✅ Correct Answers: {correctAnswers}</h3>

      <hr />

      <h3>🏆 Player List</h3>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          {players.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.score || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}