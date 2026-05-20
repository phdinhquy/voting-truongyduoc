// FULL VotePage.jsx
// COMPLETE VERSION
// LOGIN + GUEST VOTING
// GOOGLE + MICROSOFT + DEVICE FINGERPRINT

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
	serverTimestamp,
	setDoc,
	getDoc,
} from "firebase/firestore";

import {
	loginGoogle,
	loginMicrosoft,
	logoutUser,
} from "../services/userAuthService";

import Swal from "sweetalert2";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

export default function VotePage() {
	/* ====================================================== */
	/* ======================= STATE ========================= */
	/* ====================================================== */
	const [previewPoster, setPreviewPoster] = useState(null);

	const [user, setUser] = useState(null);

	const [contest, setContest] = useState(null);

	const [posters, setPosters] = useState([]);

	const [selectedPosters, setSelectedPosters] = useState([]);

	const [hasVoted, setHasVoted] = useState(false);

	const [submitting, setSubmitting] = useState(false);

	const [search, setSearch] = useState("");

	/* ================= GUEST ================= */

	const [guestMode, setGuestMode] = useState(false);

	const [deviceId, setDeviceId] = useState(null);

	const [guestVoted, setGuestVoted] = useState(false);

	const [guestVoteInfo, setGuestVoteInfo] = useState(null);

	/* ================= STATUS ================= */

	const [nowAllowed, setNowAllowed] = useState(false);

	const [voteStatusText, setVoteStatusText] = useState("");

	/* ====================================================== */
	/* ======================== AUTH ========================= */
	/* ====================================================== */

	useEffect(() => {
		return auth.onAuthStateChanged((u) => {
			setUser(u);
		});
	}, []);

	/* ====================================================== */
	/* ====================== CONTEST ======================== */
	/* ====================================================== */

	useEffect(() => {
		return onSnapshot(
			doc(db, "config", "contest"),

			(snap) => {
				setContest(snap.data());
			}
		);
	}, []);

	/* ====================================================== */
	/* ====================== POSTERS ======================== */
	/* ====================================================== */

	useEffect(() => {
		return onSnapshot(
			collection(db, "posters"),

			(snap) => {
				setPosters(
					snap.docs.map((d) => ({
						id: d.id,

						...d.data(),
					}))
				);
			}
		);
	}, []);

	/* ====================================================== */
	/* ================== LOAD LOGIN VOTE ==================== */
	/* ====================================================== */

	useEffect(() => {
		if (!user) return;

		const q = query(
			collection(db, "votes"),

			where("uid", "==", user.uid)
		);

		getDocs(q).then((snap) => {
			const votedIds = snap.docs.map((d) => d.data().posterId);

			setSelectedPosters(votedIds);

			setHasVoted(votedIds.length > 0);
		});
	}, [user]);

	/* ====================================================== */
	/* ======================= RESET ========================= */
	/* ====================================================== */

	useEffect(() => {
		if (!user) {
			setSelectedPosters([]);

			setHasVoted(false);
		}
	}, [user]);

	/* ====================================================== */
	/* ===================== TIME CHECK ====================== */
	/* ====================================================== */

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

	/* ====================================================== */
	/* ===================== USER TYPE ======================= */
	/* ====================================================== */

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

	/* ====================================================== */
	/* ===================== MAX VOTE ======================== */
	/* ====================================================== */

	const getMaxVote = () => {
		if (!contest) return 0;

		if (guestMode) {
			return contest.maxVoteGuest || 11;
		}

		return getUserType() === "internal"
			? contest.maxVoteInternal
			: contest.maxVoteGuest;
	};

	/* ====================================================== */
	/* ==================== GUEST LOGIN ====================== */
	/* ====================================================== */

	const continueAsGuest = async () => {
		try {
			setGuestMode(true);

			// CHỜ REACT RENDER
			await new Promise((resolve) => setTimeout(resolve, 50));

			const fp = await FingerprintJS.load();

			const result = await fp.get();

			const visitorId = result.visitorId;

			setDeviceId(visitorId);

			localStorage.setItem("guest_device_id", visitorId);

			const guestRef = doc(db, "guest_votes", visitorId);

			const guestSnap = await getDoc(guestRef);

			if (guestSnap.exists()) {
				const data = guestSnap.data();

				setGuestVoted(true);

				const votedTime = data.createdAt?.toDate?.();

				Swal.fire({
					icon: "info",
					title: "Bạn đã bình chọn",
					html: `
          Thiết bị này đã bình chọn vào:<br/><br/>
          <b>
            ${votedTime ? votedTime.toLocaleString("vi-VN") : "Không xác định"}
          </b>
        `,
				});

				return;
			}

			Swal.fire({
				icon: "success",
				title: "Guest Voting",
				text: "Bạn đang bình chọn với tư cách khách",
			});
		} catch (e) {
			setGuestMode(false);

			Swal.fire({
				icon: "error",
				title: "Guest Error",
				text: e.message,
			});
		}
	};

	/* ====================================================== */
	/* ======================== TOGGLE ======================= */
	/* ====================================================== */

	const togglePoster = (poster) => {
		if (
			(!user && !guestMode) ||
			hasVoted ||
			guestVoted ||
			submitting ||
			!nowAllowed
		) {
			return;
		}

		const exists = selectedPosters.includes(poster.id);

		if (exists) {
			setSelectedPosters((prev) => prev.filter((id) => id !== poster.id));

			return;
		}

		if (selectedPosters.length >= getMaxVote()) {
			Swal.fire(`Chỉ được chọn tối đa ${getMaxVote()} poster`);

			return;
		}

		setSelectedPosters((prev) => [...prev, poster.id]);
	};

	/* ====================================================== */
	/* ===================== SUBMIT VOTE ===================== */
	/* ====================================================== */

	const submitVote = async () => {
		if (!user && !guestMode) {
			return Swal.fire({
				icon: "warning",

				title: "Chưa xác nhận hình thức vote",

				text: "Vui lòng đăng nhập hoặc chọn Khách",
			});
		}

		if (!nowAllowed) {
			return Swal.fire("Ngoài thời gian bình chọn");
		}

		if (selectedPosters.length === 0) {
			return Swal.fire("Bạn chưa chọn poster");
		}

		if (submitting) return;

		const confirm = await Swal.fire({
			title: "Xác nhận bình chọn?",

			html: `Bạn đã chọn <b>${selectedPosters.length}</b> poster`,

			icon: "question",

			showCancelButton: true,

			confirmButtonText: "Xác nhận",
		});

		if (!confirm.isConfirmed) return;

		setSubmitting(true);

		try {
			/* ====================================================== */
			/* ====================== GUEST ========================== */
			/* ====================================================== */

			if (guestMode) {
				const guestRef = doc(
					db,

					"guest_votes",

					deviceId
				);

				const existed = await getDoc(guestRef);

				if (existed.exists()) {
					const data = existed.data();

					Swal.fire({
						icon: "info",

						title: "Thiết bị đã vote",

						html: `
              Thiết bị này đã vote vào:<br/><br/>
              <b>
                ${data.createdAt?.toDate?.()?.toLocaleString("vi-VN")}
              </b>
            `,
					});

					setGuestVoted(true);

					setSubmitting(false);

					return;
				}

				for (const posterId of selectedPosters) {
					await updateDoc(
						doc(db, "posters", posterId),

						{
							guestVoteCount: increment(1),
						}
					);
				}

				await setDoc(guestRef, {
					deviceId,

					posterIds: selectedPosters,

					createdAt: serverTimestamp(),

					deviceInfo: {
						userAgent: navigator.userAgent,

						platform: navigator.platform,

						language: navigator.language,
					},
				});

				localStorage.setItem(
					"guest_voted",

					"true"
				);

				setGuestVoted(true);

				setSelectedPosters([]);

				Swal.fire({
					icon: "success",

					title: "Vote thành công 🎉",

					text: "Cảm ơn bạn đã tham gia bình chọn",
				});

				setSubmitting(false);

				return;
			}

			/* ====================================================== */
			/* ====================== LOGIN ========================== */
			/* ====================================================== */

			for (const posterId of selectedPosters) {
				await addDoc(
					collection(db, "votes"),

					{
						uid: user.uid,

						email: user.email,

						posterId,

						createdAt: serverTimestamp(),
					}
				);

				await updateDoc(
					doc(db, "posters", posterId),

					{
						voteCount: increment(1),
					}
				);
			}

			Swal.fire(
				"Vote thành công 🎉",

				"",

				"success"
			);

			setHasVoted(true);

			setSelectedPosters([]);
		} catch (e) {
			Swal.fire({
				icon: "error",

				title: "Vote lỗi",

				text: e.message,
			});
		}

		setSubmitting(false);
	};

	/* ====================================================== */
	/* ====================== FACEBOOK ======================= */
	/* ====================================================== */

	const shareFacebook = (poster) => {
		const baseUrl = "https://voting-truongyduoc.vercel.app";

		const url = `${baseUrl}/poster/${poster.id}`;

		window.open(
			"https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),

			"_blank",

			"width=600,height=500"
		);
	};

	/* ====================================================== */
	/* ======================= FILTER ======================== */
	/* ====================================================== */

	const filteredPosters = posters.filter(
		(p) =>
			(p.title || "")

				.toLowerCase()

				.includes(search.toLowerCase()) ||
			(p.author || "")

				.toLowerCase()

				.includes(search.toLowerCase())
	);

	/* ====================================================== */
	/* ====================== SECURITY ======================= */
	/* ====================================================== */

	useEffect(() => {
		const blockKeys = (e) => {
			if (e.key === "F12") {
				e.preventDefault();
			}

			if (
				(e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
				(e.ctrlKey && e.key === "U")
			) {
				e.preventDefault();
			}
		};

		window.addEventListener(
			"keydown",

			blockKeys
		);

		return () => {
			window.removeEventListener(
				"keydown",

				blockKeys
			);
		};
	}, []);

	useEffect(() => {
		const blockContext = (e) => e.preventDefault();

		document.addEventListener(
			"contextmenu",

			blockContext
		);

		return () => {
			document.removeEventListener(
				"contextmenu",

				blockContext
			);
		};
	}, []);

	/* ====================================================== */
	/* ========================== UI ========================= */
	/* ====================================================== */
	useEffect(() => {
		console.log("guestMode:", guestMode);
	}, [guestMode]);
	return (
		<div className="container-fluid bg-light min-vh-100 py-4">
			{/* ====================================================== */}
			{/* ======================== HEADER ======================= */}
			{/* ====================================================== */}

			<div className="container mb-4">
				<div className="card shadow-sm border-0">
					<div className="card-body">
						<div className="d-flex align-items-center gap-3 mb-3">
							<img
								src="/logo.png"
								style={{
									width: 52,

									height: 52,
								}}
							/>

							<div>
								<div className="text-muted small">
									<h5>TRƯỜNG Y DƯỢC - ĐẠI HỌC ĐÀ NẴNG</h5>
								</div>

								<h6 className="fw-bold mb-0 text-primary">
									{contest?.title || "Poster Voting System"}
								</h6>
							</div>
						</div>

						{/* ================= STATUS ================= */}

						<div className="alert alert-info d-flex justify-content-between mb-3">
							<div>🕒 {voteStatusText}</div>

							<div>
								{contest?.startTime && contest?.endTime && (
									<>
										{new Date(contest.startTime.toDate()).toLocaleString(
											"vi-VN"
										)}
										→
										{new Date(contest.endTime.toDate()).toLocaleString("vi-VN")}
									</>
								)}
							</div>
						</div>

						{/* ================= LOGIN AREA ================= */}

						<div className="d-flex justify-content-between flex-wrap gap-2">
							<div className="text-muted small">
								{user
									? hasVoted
										? "Đã vote"
										: "Đang mở vote"
									: guestMode
									? guestVoted
										? "Thiết bị đã vote"
										: "Đang vote với tư cách khách"
									: "Vui lòng chọn hình thức bình chọn"}
							</div>

							<div className="d-flex gap-2 flex-wrap">
								{!user && !guestMode ? (
									<>
										<div className="login-stack">
											<button
												className="login-btn google"
												onClick={loginGoogle}
											>
												<i className="bi bi-google"></i>
												<span>Đăng nhập với Google</span>
											</button>

											<button
												className="login-btn microsoft"
												onClick={loginMicrosoft}
											>
												<i className="bi bi-microsoft"></i>
												<span>Đăng nhập với Microsoft 365</span>
											</button>

											<div className="divider">
												<span>hoặc</span>
											</div>

											<button
												className="login-btn guest"
												onClick={continueAsGuest}
											>
												<i className="bi bi-person-circle"></i>
												<span>Vào với tư cách Khách</span>
											</button>
										</div>
									</>
								) : (
									<>
										{user && (
											<>
												<div className="small">{user.email}</div>

												<button
													className="btn btn-outline-dark btn-sm"
													onClick={logoutUser}
												>
													Logout
												</button>
											</>
										)}

										{guestMode && (
											<div className="badge bg-warning text-dark">
												Guest Voting
											</div>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ====================================================== */}
			{/* ======================== SEARCH ======================= */}
			{/* ====================================================== */}

			{(user || guestMode) && (
				<div className="container mb-3">
					<input
						className="form-control"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Tìm poster..."
					/>
				</div>
			)}

			{/* ====================================================== */}
			{/* ===================== STATUS BAR ====================== */}
			{/* ====================================================== */}

			{(user || guestMode) && (
				<div className="container mb-3">
					<div className="alert alert-success d-flex justify-content-between">
						<div>
							Đã chọn <b>{selectedPosters.length}</b>/{getMaxVote()}
							poster
						</div>
					</div>
				</div>
			)}

			{/* ====================================================== */}
			{/* ========================= GRID ======================== */}
			{/* ====================================================== */}

			<div className="container">
				<div className="row g-4">
					{filteredPosters.map((p) => {
						const selected = selectedPosters.includes(p.id);

						return (
							<div key={p.id} className="col-xl-4 col-lg-4 col-md-6">
								<div
									className={`card h-100 shadow-sm border-0 position-relative ${
										selected ? "border-success" : ""
									}`}
									onClick={() => {
										if (!user && !guestMode) {
											Swal.fire({
												icon: "info",

												title: "Chưa xác nhận hình thức bình chọn",

												text: "Vui lòng đăng nhập hoặc tiếp tục với tư cách khách",
											});

											return;
										}

										togglePoster(p);
									}}
									style={{
										cursor:
											Boolean(user) || Boolean(guestMode)
												? "pointer"
												: "not-allowed",

										opacity: Boolean(user) || Boolean(guestMode) ? 1 : 0.7,
									}}
								>
									{/* ================= OVERLAY ================= */}

									{!user && !guestMode ? (
										<div className="guest-overlay">
											<div>
												Đăng nhập hoặc chọn Khách
												<br />
												để bình chọn
											</div>
										</div>
									) : null}

									<img
										src={p.imageUrl}
										className="card-img-top"
										style={{
											height: 240,

											objectFit: "cover",
										}}
									/>

									<div className="card-body text-center">
										<h6 className="fw-bold">{p.title}</h6>

										<small className="text-muted">{p.author}</small>

										<div className="mt-3">
											<div className="d-flex align-items-center justify-content-center gap-2 small text-muted">
												{/* LOGIN */}
												<div className="d-flex align-items-center gap-1">
													<span style={{ fontSize: 18 }}>👤</span>

													<span className="fw-semibold">
														{p.voteCount || 0}
													</span>
												</div>

												<span className="text-secondary fw-bold">+</span>

												{/* GUEST */}
												<div className="d-flex align-items-center gap-1">
													<span style={{ fontSize: 18 }}>🕵️</span>

													<span className="fw-semibold">
														{p.guestVoteCount || 0}
													</span>
												</div>

												<span className="text-secondary fw-bold">=</span>

												{/* TOTAL */}
												<div
													className="px-3 py-1 rounded-pill fw-bold d-flex align-items-center gap-2"
													style={{
														background:
															"linear-gradient(135deg,#ff4d6d,#ff758f)",
														color: "#fff",
														boxShadow: "0 4px 12px rgba(255,77,109,0.35)",
														fontSize: 18,
													}}
												>
													<span style={{ fontSize: 20 }}>❤️</span>

													<span>
														{(p.voteCount || 0) + (p.guestVoteCount || 0)}
													</span>
												</div>
											</div>
										</div>

										{(Boolean(user) || Boolean(guestMode)) &&
											!hasVoted &&
											!guestVoted &&
											nowAllowed && (
												<button
													className={`btn w-100 mt-2 ${
														selected ? "btn-success" : "btn-outline-success"
													}`}
												>
													{selected ? "Đã chọn" : "Chọn"}
												</button>
											)}

										<div className="d-flex gap-2 mt-2">
	<button
		className="btn btn-outline-dark w-100"
		onClick={(e) => {
			e.stopPropagation();

			setPreviewPoster(p);
		}}
	>
		👁 Chi tiết
	</button>

	<button
		className="btn btn-primary w-100"
		onClick={(e) => {
			e.stopPropagation();

			shareFacebook(p);
		}}
	>
		📤 Chia sẻ
	</button>
</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* ====================================================== */}
			{/* ====================== FLOAT BAR ====================== */}
			{/* ====================================================== */}

			{(user || guestMode) &&
				!hasVoted &&
				!guestVoted &&
				selectedPosters.length > 0 && (
					<div className="vote-bar shadow-lg">
						<div className="container d-flex justify-content-between align-items-center">
							<div>
								Đã chọn <b>{selectedPosters.length}</b>/{getMaxVote()}
								poster
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
				{/* ====================================================== */}
{/* ===================== PREVIEW MODAL =================== */}
{/* ====================================================== */}

{previewPoster && (
	<div
		className="modal fade show"
		style={{
			display: "block",
			background: "rgba(0,0,0,0.7)",
			zIndex: 9999,
		}}
		onClick={() => setPreviewPoster(null)}
	>
		<div
			className="modal-dialog modal-xl modal-dialog-centered"
			onClick={(e) => e.stopPropagation()}
		>
			<div className="modal-content border-0 shadow-lg">
				<div className="modal-header">
					<div>
						<h5 className="modal-title fw-bold">
							{previewPoster.title}
						</h5>

						<div className="text-muted small">
							{previewPoster.author}
						</div>
					</div>

					<button
						className="btn-close"
						onClick={() => setPreviewPoster(null)}
					></button>
				</div>

				<div
					className="modal-body text-center bg-dark"
					style={{
						maxHeight: "85vh",
						overflow: "auto",
					}}
				>
					<img
						src={previewPoster.imageUrl}
						alt={previewPoster.title}
						style={{
							width: "100%",
							height: "auto",
							borderRadius: 12,
						}}
					/>
				</div>

				<div className="modal-footer">
					<div className="me-auto small text-muted">
						👤 {previewPoster.voteCount || 0}
						&nbsp;&nbsp;+&nbsp;&nbsp;
						🕵️ {previewPoster.guestVoteCount || 0}
						&nbsp;&nbsp;=&nbsp;&nbsp;
						❤️{" "}
						{(previewPoster.voteCount || 0) +
							(previewPoster.guestVoteCount || 0)}
					</div>

					<button
						className="btn btn-secondary"
						onClick={() => setPreviewPoster(null)}
					>
						Đóng
					</button>
				</div>
			</div>
		</div>
	</div>
)}
		</div>
	);
}
