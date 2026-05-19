import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import Swal from "sweetalert2";

export default function ContestConfig() {

  const configRef = doc(db, "config", "contest");

  const [loading, setLoading] = useState(true);

  const [config, setConfig] = useState({
    title: "",
    isActive: false,
    startTime: "",
    endTime: ""
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {

    const snap = await getDoc(configRef);

    if (snap.exists()) {

      const data = snap.data();

      setConfig({
        title: data.title || "",
        isActive: data.isActive || false,
        startTime: data.startTime
          ? new Date(data.startTime.seconds * 1000)
              .toISOString()
              .slice(0,16)
          : "",
        endTime: data.endTime
          ? new Date(data.endTime.seconds * 1000)
              .toISOString()
              .slice(0,16)
          : ""
      });
    }

    setLoading(false);
  };

  /* ================= CHANGE ================= */

  const handleChange = (e) => {

    const { name, value, checked, type } = e.target;

    setConfig(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  /* ================= SAVE ================= */

  const saveConfig = async () => {

    await setDoc(configRef, {
      title: config.title,
      isActive: config.isActive,
      startTime: config.startTime
        ? new Date(config.startTime)
        : null,
      endTime: config.endTime
        ? new Date(config.endTime)
        : null,
      updatedAt: serverTimestamp()
    });

    Swal.fire({
      icon: "success",
      title: "Đã lưu cấu hình 🎉",
      timer: 1200,
      showConfirmButton: false
    });
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"/>
      </div>
    );

  /* ================= UI ================= */

  return (
    <div className="container-fluid py-4">

      {/* TITLE */}
      <div className="mb-4">
        <h2 className="fw-bold text-primary">
          ⚙️ Cấu hình cuộc thi
        </h2>
        <small className="text-muted">
          Quản lý trạng thái và thời gian bình chọn poster
        </small>
      </div>

      <div className="row g-4">

        {/* ================= STATUS ================= */}
        <div className="col-12">

          <div className="card shadow-sm border-0">

            <div className="card-body d-flex justify-content-between align-items-center flex-wrap">

              <div>
                <h5 className="mb-1">Trạng thái bình chọn</h5>
                <small className="text-muted">
                  Bật hoặc tắt hệ thống vote
                </small>
              </div>

              <div className="form-check form-switch fs-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="isActive"
                  checked={config.isActive}
                  onChange={handleChange}
                />

                <label className="ms-2 fw-bold">
                  {config.isActive
                    ? <span className="text-success">🟢 ĐANG MỞ</span>
                    : <span className="text-danger">🔴 ĐÃ ĐÓNG</span>
                  }
                </label>
              </div>

            </div>
          </div>

        </div>

        {/* ================= LEFT COLUMN ================= */}
        <div className="col-lg-6">

          <div className="card shadow-sm border-0 h-100">

            <div className="card-header bg-primary text-white fw-semibold">
              🏆 Thông tin cuộc thi
            </div>

            <div className="card-body">

              <label className="form-label fw-semibold">
                Tên cuộc thi
              </label>

              <input
                className="form-control form-control-lg"
                name="title"
                value={config.title}
                onChange={handleChange}
                placeholder="Poster NCKH Sinh viên 2026"
              />

            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="col-lg-6">

          <div className="card shadow-sm border-0 h-100">

            <div className="card-header bg-dark text-white fw-semibold">
              ⏰ Thời gian diễn ra
            </div>

            <div className="card-body">

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Thời gian bắt đầu
                </label>

                <input
                  type="datetime-local"
                  className="form-control"
                  name="startTime"
                  value={config.startTime}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label fw-semibold">
                  Thời gian kết thúc
                </label>

                <input
                  type="datetime-local"
                  className="form-control"
                  name="endTime"
                  value={config.endTime}
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* SAVE BUTTON */}
      <div className="text-end mt-4">

        <button
          className="btn btn-success btn-lg px-5 shadow-sm"
          onClick={saveConfig}
        >
          💾 Lưu cấu hình
        </button>

      </div>

    </div>
  );
}