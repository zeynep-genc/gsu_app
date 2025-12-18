import { useState } from "react";
import StudentLogin from "./StudentLogin";
import StudentRegister from "./StudentRegister";
import ClubLogin from "./ClubLogin";
import ClubRegister from "./ClubRegister";

export default function AuthTabs({
  role,
  onStudentLogin,
  onClubLogin,
  onStudentRegister,
  onClubRegister,
  disabled,
}) {
  const [tab, setTab] = useState("login"); // login | register

  return (
    <div style={{ marginTop: 30 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setTab("login")}
          style={{
            flex: 1,
            padding: 10,
            borderBottom: tab === "login" ? "2px solid black" : "1px solid #ddd",
          }}
        >
          Giriş Yap
        </button>

        <button
          onClick={() => setTab("register")}
          style={{
            flex: 1,
            padding: 10,
            borderBottom: tab === "register" ? "2px solid black" : "1px solid #ddd",
          }}
        >
          Kayıt Ol
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {role === "student" && tab === "login" && (
          <StudentLogin onSubmit={onStudentLogin} disabled={disabled} />
        )}
        {role === "student" && tab === "register" && (
          <StudentRegister onSubmit={onStudentRegister} disabled={disabled} />
        )}
        {role === "club" && tab === "login" && (
          <ClubLogin onSubmit={onClubLogin} disabled={disabled} />
        )}
        {role === "club" && tab === "register" && (
          <ClubRegister onSubmit={onClubRegister} disabled={disabled} />
        )}
      </div>
    </div>
  );
}
