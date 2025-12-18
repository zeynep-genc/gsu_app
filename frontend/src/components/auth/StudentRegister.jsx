import { useState } from "react";
import { CLASS_LEVEL_OPTIONS } from "../../constants";

export default function StudentRegister({ onSubmit, disabled }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState(0); 
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        email,
        password,
        university,
        department,
        grade,
      };
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
        placeholder="Bölüm"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
      />

      <select value={grade} onChange={(e) => setGrade(parseInt(e.target.value, 10))}>
        {CLASS_LEVEL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

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
