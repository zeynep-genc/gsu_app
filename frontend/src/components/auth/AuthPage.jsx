import { useEffect, useMemo, useState } from "react";
import "./auth.css";
import logo from "../../assets/logo.png";

// Senin projende bu componentler zaten varsa isimleri aynı kalmalı.
// Eğer isimleri farklıysa dosya adlarını buna göre düzelt.
import StudentLogin from "./StudentLogin.jsx";
import ClubLogin from "./ClubLogin.jsx";
import StudentRegister from "./StudentRegister.jsx";
import ClubRegister from "./ClubRegister.jsx";

export default function AuthPage({
  onStudentLogin,
  onClubLogin,
  onStudentRegister,
  onClubRegister,
  disabled,
}) {
  const [role, setRole] = useState(null); // "student" | "club" | null
  const [mode, setMode] = useState("login"); // "login" | "register"
  const isOpen = !!role;

  const title = useMemo(() => {
    if (!role) return "";
    const who = role === "student" ? "Öğrenci" : "Kulüp";
    const what = mode === "login" ? "Giriş" : "Kayıt";
    return `${who} ${what}`;
  }, [role, mode]);

  function openModal(nextRole) {
    setRole(nextRole);
    setMode("login");
  }

  function closeModal() {
    setRole(null);
    setMode("login");
  }

  // ESC ile kapansın
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <div className="auth-wrap">

        <div className="auth-left">
          <img className="auth-logo" src={logo} alt="UniConnect Logo" />
        </div>
        <div className="auth-right">
          <h1>UniConnect</h1>
          <p>
            Üniversite kulüpleri ve etkinlikleri tek yerde. Devam etmek için
            giriş türünü seç.
            </p>
            <div className="role-buttons">
              <button
              className="role-btn"
              onClick={() => openModal("student")}
              disabled={disabled}
              >
                Öğrenci Girişi / Kayıt
                <small>Etkinlikleri keşfet, favorile, katıl.</small>
              </button>
              <button
                className="role-btn"
                onClick={() => openModal("club")}
                disabled={disabled}
                >
                  Kulüp Girişi / Kayıt
                  <small>Etkinlik oluştur, katılımları yönet.</small>
              </button>
            </div>
          </div>
        </div>


      {/* MODAL */}
      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <h2 className="modal-title">{title}</h2>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => setMode("login")}
              >
                Giriş
              </button>
              <button
                className={`modal-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => setMode("register")}
              >
                Kayıt
              </button>
            </div>

            {/* İçerik */}
            {role === "student" && mode === "login" && (
              <StudentLogin onSubmit={onStudentLogin} disabled={disabled} />
            )}
            {role === "student" && mode === "register" && (
              <StudentRegister
                onSubmit={onStudentRegister}
                disabled={disabled}
              />
            )}

            {role === "club" && mode === "login" && (
              <ClubLogin onSubmit={onClubLogin} disabled={disabled} />
            )}
            {role === "club" && mode === "register" && (
              <ClubRegister onSubmit={onClubRegister} disabled={disabled} />
            )}

            <div className="modal-hint">
              İpucu: ESC ile kapatabilirsin.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
