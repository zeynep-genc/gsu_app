import { useState } from "react";

export default function StudentLogin({ onSubmit, disabled }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err.message || "Giriş başarısız");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Öğrenci E-postası"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
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
