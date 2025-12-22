import { useState } from "react";
import { CLASS_LEVEL_OPTIONS } from "../../constants";

const EDU_EMAIL_REGEX = /^[^@]+@[^@]+\.edu\.tr$/i;

export default function StudentRegister({ onSubmit, disabled, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!university.trim()) {
      setError("Üniversite bilgisi zorunludur.");
      return;
    }
    if (!department.trim()) {
      setError("Bölüm bilgisi zorunludur.");
      return;
    }
    if (!trimmedEmail || !EDU_EMAIL_REGEX.test(trimmedEmail)) {
      setError("Lütfen edu.tr uzantılı üniversite e-postası giriniz.");
      return;
    }
    if (!password) {
      setError("Şifre belirleyin.");
      return;
    }

    const payload = {
      email: trimmedEmail,
      password,
      university: university.trim(),
      department: department.trim(),
    };
    if (grade !== "") {
      payload.grade = Number(grade);
    }

    try {
      await onSubmit(payload);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Kayıt başarısız");
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <input
        placeholder="Üniversite"
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
      />

      <input
        placeholder="Bölüm"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
      />

      <select value={grade} onChange={(e) => setGrade(e.target.value)}>
        <option value="">Sınıf (opsiyonel)</option>
        {CLASS_LEVEL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        placeholder="E-postanız (edu.tr)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <small style={{ fontSize: 11, color: "#6b7280" }}>
        Hem öğrenciler hem akademisyenler için edu.tr uzantısı zorunlu.
      </small>

      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <div className="auth-error">{error}</div>}
      <button className="auth-button" disabled={disabled}>
        Kayıt Ol
      </button>
    </form>
  );
}
