import { useState } from "react";

export default function ClubLogin({ onSubmit, disabled }) {
  const [university, setUniversity] = useState("");
  const [clubName, setClubName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({
        university,
        club_name: clubName,
        password,
      });
    } catch (err) {
      setError(err.message || "Giriş başarısız");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
