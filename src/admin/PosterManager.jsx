import { useEffect, useState } from "react";
import { db, storage } from "../firebase/firebase";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

import Swal from "sweetalert2";

export default function PosterManager() {

  const postersRef = collection(db, "posters");

  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    title: "",
    author: "",
    instructor: "",
    image: null
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState(null);

  /* ================= LOAD ================= */

  const loadPosters = async () => {
    const snap = await getDocs(postersRef);

    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    setPosters(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPosters();
  }, []);

  /* ================= INPUT ================= */

  const handleChange = e => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0];
      setForm({ ...form, image: file });

      if (file)
        setPreview(URL.createObjectURL(file));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  /* ================= SAVE ================= */

  const savePoster = async () => {

    if (!form.title)
      return Swal.fire("Thiếu tên poster");

    try {

      Swal.fire({
        title: "Đang xử lý...",
        allowOutsideClick:false,
        didOpen:()=>Swal.showLoading()
      });

      let docRef;

      /* ===== CREATE ===== */

      if (!editingId) {

        docRef = await addDoc(postersRef, {
          title: form.title,
          author: form.author,
          instructor: form.instructor,
          voteCount: 0,
          createdAt: serverTimestamp()
        });

      } else {
        docRef = doc(db,"posters",editingId);

        await updateDoc(docRef,{
          title:form.title,
          author:form.author,
          instructor:form.instructor
        });
      }

      /* ===== UPLOAD IMAGE ===== */

      if (form.image) {

        const imageRef = ref(
          storage,
          `posters/${editingId || docRef.id}`
        );

        await uploadBytes(imageRef, form.image);

        const url = await getDownloadURL(imageRef);

        await updateDoc(
          editingId
            ? doc(db,"posters",editingId)
            : docRef,
          { imageUrl: url }
        );
      }

      Swal.fire("✅ Thành công");

      setForm(emptyForm);
      setEditingId(null);
      setPreview(null);

      loadPosters();

    } catch(err){
      console.error(err);
      Swal.fire("Lỗi upload");
    }
  };

  /* ================= EDIT ================= */

  const editPoster = poster => {
    setEditingId(poster.id);

    setForm({
      title:poster.title,
      author:poster.author,
      instructor:poster.instructor,
      image:null
    });

    setPreview(poster.imageUrl);
    window.scrollTo(0,0);
  };

  /* ================= DELETE ================= */

  const removePoster = async poster => {

    const confirm = await Swal.fire({
      title:"Xóa poster?",
      icon:"warning",
      showCancelButton:true
    });

    if(!confirm.isConfirmed) return;

    await deleteDoc(doc(db,"posters",poster.id));

    try{
      await deleteObject(
        ref(storage,`posters/${poster.id}`)
      );
    }catch{}

    Swal.fire("Đã xoá");

    loadPosters();
  };

  /* ================= RESET VOTE ================= */

  const resetVote = async poster => {

    await updateDoc(doc(db,"posters",poster.id),{
      voteCount:0
    });

    Swal.fire("Đã reset vote");

    loadPosters();
  };

  /* ================= UI ================= */

  if(loading)
    return <div className="spinner-border m-5"/>;

  return(
    <div className="container py-4">

      <h2 className="mb-4">
        🖼 Quản lý Poster
      </h2>

      {/* FORM */}

      <div className="card shadow mb-4">
        <div className="card-body">

          <h5>
            {editingId ? "✏️ Sửa Poster" : "➕ Thêm Poster"}
          </h5>

          <div className="row g-3">

            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Tên poster"
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Tác giả"
                name="author"
                value={form.author}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Người hướng dẫn"
                name="instructor"
                value={form.instructor}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <input
                type="file"
                className="form-control"
                name="image"
                onChange={handleChange}
              />
            </div>

            {preview && (
              <div className="col-md-6">
                <img
                  src={preview}
                  style={{
                    width:"100%",
                    height:200,
                    objectFit:"cover",
                    borderRadius:10
                  }}
                />
              </div>
            )}

          </div>

          <button
            className="btn btn-success mt-3"
            onClick={savePoster}
          >
            {editingId ? "Update" : "Create"}
          </button>

        </div>
      </div>

      {/* LIST */}

      <div className="row">

        {posters.map(p=>(
          <div key={p.id} className="col-lg-4 col-md-6 mb-4">

            <div className="card h-100 shadow-sm">

              <img
                src={p.imageUrl}
                className="card-img-top"
                style={{height:230,objectFit:"cover"}}
              />

              <div className="card-body">

                <h5>{p.title}</h5>
                <p className="mb-1">👤 {p.author}</p>
                <p className="mb-2">🎓 {p.instructor}</p>

                <span className="badge bg-danger">
                  ❤️ {p.voteCount || 0} vote
                </span>

                <div className="mt-3 d-flex gap-2">

                  <button
                    className="btn btn-warning btn-sm"
                    onClick={()=>editPoster(p)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={()=>resetVote(p)}
                  >
                    Reset
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={()=>removePoster(p)}
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}