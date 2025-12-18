import { useState } from "react";

export default function ClubRegister({ onSubmit, disabled }) {
  const [university, setUniversity] = useState("");
  const [clubName, setClubName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({
        university,
        name: clubName,
        email,
        password,
      });
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
        placeholder="Kulüp Adı"
        value={clubName}
        onChange={(e) => setClubName(e.target.value)}
      />

      <input
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

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
