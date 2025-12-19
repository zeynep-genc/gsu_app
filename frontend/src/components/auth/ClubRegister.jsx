import { useState } from "react";

const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]+$/i;

export default function ClubRegister({ onSubmit, disabled }) {
  const [university, setUniversity] = useState("");
  const [clubName, setClubName] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedUniversity = (university || "").trim();
    const trimmedClub = (clubName || "").trim();
    const trimmedEmail = (responsibleEmail || "").trim().toLowerCase();
    const trimmedCity = (city || "").trim();
    if (!trimmedUniversity) {
      setError("Üniversite adı zorunludur.");
      return;
    }
    if (!trimmedClub) {
      setError("Kulüp adı zorunludur.");
      return;
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Geçerli bir sorumlu hoca e-postası giriniz.");
      return;
    }
    if (!trimmedCity) {
      setError("İl / şehir bilgisi zorunludur.");
      return;
    }
    if (!password) {
      setError("Şifre belirlenmeli.");
      return;
    }

    const payload = {
      university: trimmedUniversity,
      name: trimmedClub,
      email: trimmedEmail,
      city: trimmedCity,
      description: description.trim(),
      password,
    };

    try {
      await onSubmit(payload);
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
        placeholder="Kulüp Sorumlu Hoca E-posta"
        type="email"
        value={responsibleEmail}
        onChange={(e) => setResponsibleEmail(e.target.value)}
      />

      <input
        placeholder="Şehir"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <textarea
        placeholder="Kulüp Açıklaması (opsiyonel)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
