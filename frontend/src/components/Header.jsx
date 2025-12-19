import logo from "../assets/logo.png";

export default function Header({ view, onLogout }) {
  return (
    <header>
      <div>
        <div className="header-brand">
          <img src={logo} alt="UniConnect" />
          <span>UniConnect</span>
        </div>

        <span className="subtitle">
          Türkiye üniversite kulüp ve etkinlik yönetim platformu
        </span>
      </div>
      <div className="right">
        {view === "login" ? (
          <span style={{ fontSize: 12 }}>Giriş yapılmadı</span>
        ) : (
          <>
            <span style={{ fontSize: 12 }}>
              Oturum:{" "}
              <strong>{view === "student" ? "Öğrenci" : "Kulüp Temsilcisi"}</strong>
            </span>
            <button onClick={onLogout}>Çıkış</button>
          </>
        )}
      </div>
    </header>
  );
}
