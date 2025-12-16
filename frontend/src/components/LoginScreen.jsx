import { useState } from "react";

export default function LoginScreen({
  onStudentSubmit,
  onClubSubmit,
  onStudentRegister,
  onClubRegister,
  disabled,
}) {
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentError, setStudentError] = useState("");

  const [clubUniversity, setClubUniversity] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubPassword, setClubPassword] = useState("");
  const [clubError, setClubError] = useState("");

  const [studentReg, setStudentReg] = useState({
    email: "",
    username: "",
    password: "",
    university: "",
    department: "",
    grade: 1,
  });
  const [studentRegMsg, setStudentRegMsg] = useState("");
  const [studentRegErr, setStudentRegErr] = useState("");

  const [clubReg, setClubReg] = useState({
    name: "",
    university: "",
    city: "",
    description: "",
    email: "",
    password: "",
  });
  const [clubRegMsg, setClubRegMsg] = useState("");
  const [clubRegErr, setClubRegErr] = useState("");

  async function handleStudentLogin(event) {
    event.preventDefault();
    setStudentError("");
    try {
      await onStudentSubmit?.({
        email: studentEmail,
        password: studentPassword,
      });
    } catch (error) {
      setStudentError(error.message || "E-posta veya şifre hatalı.");
    }
  }

  async function handleClubLogin(event) {
    event.preventDefault();
    setClubError("");
    try {
      await onClubSubmit?.({
        university: clubUniversity,
        club_name: clubName,
        password: clubPassword,
      });
    } catch (error) {
      setClubError(
        error.message ||
          "Bilgiler hatalı. Okul adı, kulüp adı ve şifreyi kontrol edin."
      );
    }
  }

  async function handleStudentRegister(event) {
    event.preventDefault();
    setStudentRegErr("");
    setStudentRegMsg("");
    try {
      await onStudentRegister?.({
        ...studentReg,
        grade: Number(studentReg.grade) || 1,
      });
      setStudentRegMsg("Kayıt tamamlandı. Giriş yapabilirsiniz.");
      setStudentReg({
        email: "",
        username: "",
        password: "",
        university: "",
        department: "",
        grade: 1,
      });
    } catch (error) {
      setStudentRegErr(error.message || "Kayıt işlemi başarısız oldu.");
    }
  }

  async function handleClubRegister(event) {
    event.preventDefault();
    setClubRegErr("");
    setClubRegMsg("");
    try {
      await onClubRegister?.(clubReg);
      setClubRegMsg("Kulüp kaydınız oluşturuldu. Artık giriş yapabilirsiniz.");
      setClubReg({
        name: "",
        university: "",
        city: "",
        description: "",
        email: "",
        password: "",
      });
    } catch (error) {
      setClubRegErr(error.message || "Kayıt işlemi başarısız oldu.");
    }
  }

  return (
    <main>
      <div className="card">
        <h2>UniConnect Giriş Ekranı</h2>
        <p style={{ fontSize: 14, color: "#4b5563" }}>
          Bu ekran üzerinden öğrenci ya da kulüp temsilcisi olarak giriş
          yapabilir, kulüp etkinliklerini görüntüleyebilir ve yönetebilirsiniz.
        </p>

        <div className="login-wrapper">
          <form
            className="login-box card"
            style={{ marginBottom: 0 }}
            onSubmit={handleStudentLogin}
          >
            <h2>Öğrenci Girişi</h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Öğrenci, Türkiye’deki üniversitelerdeki kulüp etkinliklerini
              görüntüleyip ilgi alanına uygun etkinlikleri inceleyebilir ve
              katılım isteği gönderebilir.
            </p>
            <label>E-posta</label>
            <input
              placeholder="ornek@uni.edu.tr"
              value={studentEmail}
              onChange={(event) => setStudentEmail(event.target.value)}
            />
            <label>Şifre</label>
            <input
              type="password"
              placeholder="Şifreniz"
              value={studentPassword}
              onChange={(event) => setStudentPassword(event.target.value)}
            />
            {studentError && <div className="error-text">{studentError}</div>}
            <button className="btn" type="submit" disabled={disabled}>
              Öğrenci olarak giriş yap
            </button>
          </form>

          <form
            className="login-box card"
            style={{ marginBottom: 0 }}
            onSubmit={handleClubLogin}
          >
            <h2>Kulüp Temsilcisi Girişi</h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Kulüp temsilcisi, bağlı olduğu kulüp adına etkinlikleri oluşturur
              ve yönetir.
            </p>
            <label>Okul Adı</label>
            <input
              placeholder="Örn: Galatasaray Üniversitesi"
              value={clubUniversity}
              onChange={(event) => setClubUniversity(event.target.value)}
            />
            <label>Kulüp Adı</label>
            <input
              placeholder="Örn: Bilgisayar Mühendisliği Kulübü"
              value={clubName}
              onChange={(event) => setClubName(event.target.value)}
            />
            <label>Şifre</label>
            <input
              type="password"
              placeholder="Kulüp şifresi"
              value={clubPassword}
              onChange={(event) => setClubPassword(event.target.value)}
            />
            {clubError && <div className="error-text">{clubError}</div>}
            <button className="btn" type="submit" disabled={disabled}>
              Kulüp temsilcisi olarak giriş yap
            </button>
          </form>
        </div>

        <div className="login-wrapper" style={{ marginTop: 32 }}>
          <form className="login-box card" onSubmit={handleStudentRegister}>
            <h2>Öğrenci Kayıt</h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Yeni öğrenci hesabı oluşturduğunuzda doğrudan veritabanına
              kaydedilir.
            </p>
            <label>E-posta *</label>
            <input
              value={studentReg.email}
              onChange={(event) =>
                setStudentReg((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              required
            />
            <label>Kullanıcı Adı *</label>
            <input
              value={studentReg.username}
              onChange={(event) =>
                setStudentReg((prev) => ({
                  ...prev,
                  username: event.target.value,
                }))
              }
              required
            />
            <label>Şifre *</label>
            <input
              type="password"
              value={studentReg.password}
              onChange={(event) =>
                setStudentReg((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              required
            />
            <label>Üniversite *</label>
            <input
              value={studentReg.university}
              onChange={(event) =>
                setStudentReg((prev) => ({
                  ...prev,
                  university: event.target.value,
                }))
              }
              required
            />
            <label>Bölüm *</label>
            <input
              value={studentReg.department}
              onChange={(event) =>
                setStudentReg((prev) => ({
                  ...prev,
                  department: event.target.value,
                }))
              }
              required
            />
            <label>Sınıf *</label>
            <input
              type="number"
              min="1"
              max="5"
              value={studentReg.grade}
              onChange={(event) =>
                setStudentReg((prev) => ({
                  ...prev,
                  grade: event.target.value,
                }))
              }
              required
            />
            <button className="btn" type="submit" disabled={disabled}>
              Öğrenci kaydı oluştur
            </button>
            {studentRegMsg && (
              <p style={{ fontSize: 12, marginTop: 8, color: "#16a34a" }}>
                {studentRegMsg}
              </p>
            )}
            {studentRegErr && (
              <p style={{ fontSize: 12, marginTop: 8, color: "#dc2626" }}>
                {studentRegErr}
              </p>
            )}
          </form>

          <form className="login-box card" onSubmit={handleClubRegister}>
            <h2>Kulüp Temsilcisi Kayıt</h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Kulüp kaydı sonrası kulüp paneline giriş yapabilirsiniz.
            </p>
            <label>Kulüp Adı *</label>
            <input
              value={clubReg.name}
              onChange={(event) =>
                setClubReg((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <label>Üniversite *</label>
            <input
              value={clubReg.university}
              onChange={(event) =>
                setClubReg((prev) => ({
                  ...prev,
                  university: event.target.value,
                }))
              }
              required
            />
            <label>Şehir *</label>
            <input
              value={clubReg.city}
              onChange={(event) =>
                setClubReg((prev) => ({ ...prev, city: event.target.value }))
              }
              required
            />
            <label>E-posta *</label>
            <input
              value={clubReg.email}
              onChange={(event) =>
                setClubReg((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
            <label>Şifre *</label>
            <input
              type="password"
              value={clubReg.password}
              onChange={(event) =>
                setClubReg((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              required
            />
            <label>Kulüp Açıklaması</label>
            <textarea
              value={clubReg.description}
              onChange={(event) =>
                setClubReg((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            ></textarea>
            <button className="btn" type="submit" disabled={disabled}>
              Kulüp kaydı oluştur
            </button>
            {clubRegMsg && (
              <p style={{ fontSize: 12, marginTop: 8, color: "#16a34a" }}>
                {clubRegMsg}
              </p>
            )}
            {clubRegErr && (
              <p style={{ fontSize: 12, marginTop: 8, color: "#dc2626" }}>
                {clubRegErr}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
