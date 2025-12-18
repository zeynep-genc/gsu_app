import { useState } from "react";
import RoleSelector from "./RoleSelector";
import AuthTabs from "./AuthTabs";

export default function AuthPage({
  onStudentLogin,
  onClubLogin,
  onStudentRegister,
  onClubRegister,
  disabled,
}) {
  const [role, setRole] = useState(null); // "student" | "club"

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <div className="auth-card">
        <div className="auth-title">UniConnect</div>

        <RoleSelector role={role} onSelect={setRole} />

        {role && (
          <AuthTabs
            role={role}
            onStudentLogin={onStudentLogin}
            onClubLogin={onClubLogin}
            onStudentRegister={onStudentRegister}
            onClubRegister={onClubRegister}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}
