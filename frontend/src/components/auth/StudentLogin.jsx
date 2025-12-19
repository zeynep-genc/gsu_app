import { useState } from "react";

const EDU_EMAIL_REGEX = /^[^@]+@[^@]+\.edu\.tr$/i;

export default function StudentLogin({ onSubmit, disabled }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail || !EDU_EMAIL_REGEX.test(trimmedEmail)) {
      setError("Lütfen üniversite e-postası (edu.tr uzantılı) ile giriş yapın.");
      return;
    }
    if (!password) {
      setError("Şifrenizi girin.");
      return;
    }

    try {
      await onSubmit({ email: trimmedEmail, password });
    } catch (err) {
      setError(err.message || "Giriş başarısız");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Öğrenci E-postası"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <small style={{ fontSize: 11, color: "#6b7280" }}>
        Sadece ".edu.tr" uzantılı e-postalar kullanılır.
      </small>
      <input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      <button disabled={disabled}>Giriş Yap</button>
    </form>
  );
}
