import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "firebase/firestore";

export default function PosterManager() {

  const [posters, setPosters] = useState([]);
  const [url, setUrl] = useState("");

  useEffect(() => {

    const unsub = onSnapshot(
      collection(db, "posters"),
      snap => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setPosters(data);
      }
    );

    return () => unsub();

  }, []);

  const addPoster = async () => {

    if (!url) return;

    await addDoc(collection(db, "posters"), {
      url,
      createdAt: Date.now()
    });

    setUrl("");
  };

  const deletePoster = async (id) => {
    await deleteDoc(doc(db, "posters", id));
  };

  return (
    <div>

      <h2>🖼 POSTER MANAGER</h2>

      <input
        placeholder="Poster Image URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />

      <button onClick={addPoster}>
        Add Poster
      </button>

      <hr />

      {posters.map(p => (
        <div key={p.id} style={{ marginBottom: 20 }}>

          <img
            src={p.url}
            width="300"
            alt="poster"
          />

          <br />

          <button onClick={() => deletePoster(p.id)}>
            Delete
          </button>

        </div>
      ))}

    </div>
  );
}